const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { resolveMessage, countParts, calculateCost } = require('../utils/sms-utils');
const { startCampaign } = require('../services/campaign-sender');
const prisma = require('../db');

const router = express.Router();

router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { groupId, message } = req.body;
    if (!groupId || !message) {
      return res.status(400).json({ error: 'groupId and message are required' });
    }

    const contacts = await prisma.contact.findMany({
      where: { groupId: parseInt(groupId), userId: req.user.id },
    });

    if (contacts.length === 0) {
      return res.json({ totalContacts: 0, totalParts: 0, totalCost: 0, breakdown: [] });
    }

    let totalParts = 0;
    const breakdown = contacts.map((c) => {
      const resolved = resolveMessage(message, c.name);
      const info = countParts(resolved);
      totalParts += info.parts;
      return {
        name: c.name,
        phone: c.phone,
        resolvedLength: info.charCount,
        encoding: info.encoding,
        parts: info.parts,
      };
    });

    res.json({ totalContacts: contacts.length, totalParts, totalCost: totalParts, breakdown });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { groupId, message, scheduledAt } = req.body;
    if (!groupId || !message) {
      return res.status(400).json({ error: 'groupId and message are required' });
    }

    const group = await prisma.group.findFirst({
      where: { id: parseInt(groupId), userId: req.user.id },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const contacts = await prisma.contact.findMany({ where: { groupId: group.id } });
    if (contacts.length === 0) {
      return res.status(400).json({ error: 'Group has no contacts' });
    }

    let totalCost = 0;
    const resolved = contacts.map((c) => {
      const content = resolveMessage(message, c.name);
      const parts = countParts(content).parts;
      totalCost += parts;
      return { contact: c, content, parts };
    });

    const status = scheduledAt ? 'SCHEDULED' : 'DRAFT';
    let campaign;

    try {
      campaign = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: req.user.id } });
        if (user.credits < totalCost) {
          const err = new Error('INSUFFICIENT_CREDITS');
          err.credits = user.credits;
          throw err;
        }

        const newCampaign = await tx.campaign.create({
          data: {
            userId: req.user.id,
            groupId: group.id,
            message,
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            totalContacts: contacts.length,
            creditsUsed: totalCost,
          },
        });

        for (const { contact: c, content, parts } of resolved) {
          await tx.message.create({
            data: {
              campaignId: newCampaign.id,
              contactId: c.id,
              contactName: c.name,
              contactPhone: c.phone,
              content,
              parts,
              cost: parts,
              status: 'PENDING',
            },
          });
        }

        await tx.user.update({
          where: { id: req.user.id },
          data: { credits: { decrement: totalCost } },
        });

        return newCampaign;
      });
    } catch (err) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        return res.status(400).json({
          error: `Not enough credits. Need ${totalCost}, have ${err.credits}`,
        });
      }
      throw err;
    }

    if (!scheduledAt) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING', startedAt: new Date() },
      });
      startCampaign(campaign.id);
    }

    res.status(201).json(campaign);
  } catch (err) {
    console.error('Campaign creation error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: { group: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: {
        group: { select: { name: true } },
        messages: {
          select: {
            id: true,
            contactName: true,
            contactPhone: true,
            content: true,
            parts: true,
            cost: true,
            status: true,
            route: true,
            sentAt: true,
          },
        },
      },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

module.exports = router;
