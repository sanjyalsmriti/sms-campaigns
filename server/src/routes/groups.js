const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { contacts: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const group = await prisma.group.create({
      data: { name, userId: req.user.id },
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

module.exports = router;
