const cron = require('node-cron');
const prisma = require('../db');
const { startCampaign } = require('./campaign-sender');

function initScheduler() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const due = await prisma.campaign.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
        select: { id: true },
      });

      for (const { id } of due) {
        // Atomic claim: only the update that wins here will call startCampaign.
        // A second tick arriving before the first finishes will find status no
        // longer SCHEDULED and skip it.
        const claimed = await prisma.campaign.updateMany({
          where: { id, status: 'SCHEDULED' },
          data: { status: 'SENDING', startedAt: new Date() },
        });
        if (claimed.count > 0) {
          startCampaign(id);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });

  console.log('Campaign scheduler started');
}

async function resumeInProgressCampaigns() {
  try {
    const sending = await prisma.campaign.findMany({
      where: { status: 'SENDING' },
      select: { id: true },
    });
    for (const { id } of sending) {
      console.log(`Resuming campaign ${id}`);
      startCampaign(id);
    }
  } catch (err) {
    console.error('Failed to resume in-progress campaigns:', err);
  }
}

module.exports = { initScheduler, resumeInProgressCampaigns };
