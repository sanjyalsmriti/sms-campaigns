const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const groupRoutes = require('./routes/groups');
const campaignRoutes = require('./routes/campaigns');
const adminRoutes = require('./routes/admin');
const { initScheduler, resumeInProgressCampaigns } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initScheduler();
  resumeInProgressCampaigns();
});
