const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { getPublicStats } = require('../controllers/publicController');

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: process.env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan statistik publik.' },
});

router.get('/stats', publicLimiter, getPublicStats);

module.exports = router;
