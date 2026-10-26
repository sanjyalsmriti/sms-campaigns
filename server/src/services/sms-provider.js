const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate sending a message through a route.
// Returns true on success, false on simulated failure.
function simulateSend(route) {
  return Math.random() >= route.failureRate;
}

// Try sending a message through available routes with failover.
// Returns { success, routeName } or { success: false, routeName: null }
async function sendWithFailover(messageCost) {
  const routes = await prisma.route.findMany({
    where: { balance: { gt: 0 } },
    orderBy: { priority: 'asc' },
  });

  for (const route of routes) {
    if (route.balance < messageCost) continue;

    const success = simulateSend(route);
    if (success) {
      // Deduct from route balance
      await prisma.route.update({
        where: { id: route.id },
        data: { balance: { decrement: messageCost } },
      });
      return { success: true, routeName: route.name };
    }
    // Route failed, try next one
  }

  return { success: false, routeName: null };
}

module.exports = { sendWithFailover };
