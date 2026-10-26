const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// List all users with credits
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, credits: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Top up user credits
router.post('/users/:id/topup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { id: true, email: true, name: true, credits: true },
    });

    res.json(user);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to top up credits' });
  }
});

// Route health: balance and success rate per route
router.get('/routes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const routes = await prisma.route.findMany({ orderBy: { priority: 'asc' } });

    // Calculate success rate per route from message records
    const routeStats = await Promise.all(
      routes.map(async (route) => {
        const total = await prisma.message.count({ where: { route: route.name } });
        const sent = await prisma.message.count({
          where: { route: route.name, status: 'SENT' },
        });
        return {
          ...route,
          totalSent: total,
          successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 'N/A',
        };
      })
    );

    res.json(routeStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

module.exports = router;
