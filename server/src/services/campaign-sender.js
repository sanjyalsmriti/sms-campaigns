const prisma = require('../db');
const { sendWithFailover } = require('./sms-provider');

const BATCH_SIZE = 50;

async function startCampaign(campaignId) {
  try {
    while (true) {
      const messages = await prisma.message.findMany({
        where: { campaignId, status: 'PENDING' },
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });

      if (messages.length === 0) break;

      for (const msg of messages) {
        await processMessage(campaignId, msg);
      }

      await sleep(100);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  } catch (err) {
    console.error(`Campaign ${campaignId} sender error:`, err);
  }
}

async function processMessage(campaignId, msg) {
  // Re-read before acting so a restart that picks up mid-batch doesn't re-send.
  const current = await prisma.message.findUnique({ where: { id: msg.id } });
  if (!current || current.status !== 'PENDING') return;

  const result = await sendWithFailover(msg.cost);

  if (result.success) {
    await prisma.$transaction([
      prisma.message.update({
        where: { id: msg.id },
        data: { status: 'SENT', route: result.routeName, sentAt: new Date() },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      }),
    ]);
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: msg.id },
        data: { status: 'FAILED' },
      });
      await tx.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 }, creditsUsed: { decrement: msg.cost } },
      });
      const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
      await tx.user.update({
        where: { id: campaign.userId },
        data: { credits: { increment: msg.cost } },
      });
    });
  }

  await sleep(50);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { startCampaign };
