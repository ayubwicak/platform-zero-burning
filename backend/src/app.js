const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const photoRoutes = require('./routes/photoRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const incentiveRoutes = require('./routes/incentiveRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportRoutes = require('./routes/reportRoutes');

const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'zero-burning-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use(reportRoutes);

// Serve uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend-web/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;