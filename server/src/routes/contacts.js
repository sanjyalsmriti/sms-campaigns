const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { normalizePhone } = require('../utils/sms-utils');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Upload CSV to a group
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const groupName = req.body.groupName;
    if (!groupName) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Create or find group
    let group = await prisma.group.findFirst({
      where: { name: groupName, userId: req.user.id },
    });
    if (!group) {
      group = await prisma.group.create({
        data: { name: groupName, userId: req.user.id },
      });
    }

    // Parse CSV
    const rows = [];
    const errors = [];
    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          const name = (row.name || row.Name || '').trim();
          const rawPhone = (row.phone || row.Phone || row.number || row.Number || '').trim();
          const phone = normalizePhone(rawPhone);

          if (!name) {
            errors.push({ row: rawPhone, reason: 'Missing name' });
          } else if (!phone) {
            errors.push({ row: rawPhone, reason: 'Invalid phone number' });
          } else {
            rows.push({ name, phone });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Deduplicate within the parsed rows
    const seen = new Set();
    const unique = [];
    for (const row of rows) {
      if (!seen.has(row.phone)) {
        seen.add(row.phone);
        unique.push(row);
      }
    }
    const duplicatesInFile = rows.length - unique.length;

    // Insert contacts, skipping duplicates already in the group
    let added = 0;
    let skipped = 0;
    for (const { name, phone } of unique) {
      try {
        await prisma.contact.create({
          data: { name, phone, groupId: group.id, userId: req.user.id },
        });
        added++;
      } catch (err) {
        // Unique constraint violation — already exists in group
        if (err.code === 'P2002') {
          skipped++;
        } else {
          throw err;
        }
      }
    }

    res.json({
      groupId: group.id,
      groupName: group.name,
      total: rows.length,
      added,
      duplicatesInFile,
      duplicatesInGroup: skipped,
      invalid: errors.length,
      errors: errors.slice(0, 20), // show first 20 errors
    });
  } catch (err) {
    console.error('CSV upload error:', err);
    res.status(500).json({ error: 'Failed to process CSV' });
  }
});

// List contacts (optionally by group)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.groupId) {
      where.groupId = parseInt(req.query.groupId);
    }
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
