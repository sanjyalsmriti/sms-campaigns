const cron = require('node-cron');
const prisma = require('../db');
const { startCampaign } = require('./campaign-sender');

function initScheduler() {
  // Check every 30 seconds for scheduled campaigns that are due
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const due = await prisma.campaign.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: new Date() },
        },
      });

      for (const campaign of due) {
        console.log(`Starting scheduled campaign ${campaign.id}`);
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'SENDING', startedAt: new Date() },
        });
        startCampaign(campaign.id);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });

  console.log('Campaign scheduler started (checks every 30s)');
}

// Resume any campaigns that were SENDING when the server restarted
async function resumeInProgressCampaigns() {
  try {
    const sending = await prisma.campaign.findMany({
      where: { status: 'SENDING' },
    });

    for (const campaign of sending) {
      console.log(`Resuming campaign ${campaign.id}`);
      startCampaign(campaign.id);
    }
  } catch (err) {
    console.error('Resume error:', err);
  }
}

module.exports = { initScheduler, resumeInProgressCampaigns };
