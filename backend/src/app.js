const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { rejectClaim, cancelClaim } = require('./controllers/incentiveController');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

const app = express();

// Konfigurasi trust proxy untuk penanganan IP akurat di balik reverse proxy
app.set('trust proxy', 1);

// Keamanan HTTP Header via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Terarah
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  })
);

// Rate limiter untuk mencegah brute-force pada endpoint auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: Number(process.env.AUTH_RATE_LIMIT) || (process.env.NODE_ENV === 'test' ? 10000 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'zero-burning-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use(reportRoutes);

// Direct claim actions compatibility
const claimsDirectRouter = express.Router();
claimsDirectRouter.post('/:id/reject', authenticateToken, authorizeRoles('petugas', 'admin'), rejectClaim);
claimsDirectRouter.post('/:id/cancel', authenticateToken, authorizeRoles('petugas', 'admin'), cancelClaim);
app.use('/api/claims', claimsDirectRouter);

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