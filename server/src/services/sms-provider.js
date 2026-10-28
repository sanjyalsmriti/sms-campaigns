const prisma = require('../db');

function simulateSend(route) {
  return Math.random() >= route.failureRate;
}

async function sendWithFailover(messageCost) {
  const routes = await prisma.route.findMany({
    where: { balance: { gt: 0 } },
    orderBy: { priority: 'asc' },
  });

  for (const route of routes) {
    if (route.balance < messageCost) continue;

    if (simulateSend(route)) {
      await prisma.route.update({
        where: { id: route.id },
        data: { balance: { decrement: messageCost } },
      });
      return { success: true, routeName: route.name };
    }
  }

  return { success: false, routeName: null };
}

module.exports = { sendWithFailover };
