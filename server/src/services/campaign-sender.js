const prisma = require('../db');
const { sendWithFailover } = require('./sms-provider');
const BATCH_SIZE = 50;

async function startCampaign(campaignId) {
  try {
    // Process in batches
    let processed = 0;
    while (true) {
      const messages = await prisma.message.findMany({
        where: { campaignId, status: 'PENDING' },
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });

      if (messages.length === 0) break;

      for (const msg of messages) {
        await processMessage(campaignId, msg);
        processed++;
      }

      // Small delay between batches to simulate real-world processing
      await sleep(100);
    }

    // Mark campaign as completed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  } catch (err) {
    console.error(`Campaign ${campaignId} sender error:`, err);
  }
}

async function processMessage(campaignId, msg) {
  // Double-check message is still PENDING (idempotency guard)
  const current = await prisma.message.findUnique({ where: { id: msg.id } });
  if (!current || current.status !== 'PENDING') return;

  const result = await sendWithFailover(msg.cost);

  if (result.success) {
    // Mark as sent
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
    // All routes failed — refund credits to user
    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: msg.id },
        data: { status: 'FAILED' },
      });
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          failedCount: { increment: 1 },
          creditsUsed: { decrement: msg.cost },
        },
      });
      // Refund credits to the campaign owner
      const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
      await tx.user.update({
        where: { id: campaign.userId },
        data: { credits: { increment: msg.cost } },
      });
    });
  }

  // Small delay to simulate network latency
  await sleep(50);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { startCampaign };
