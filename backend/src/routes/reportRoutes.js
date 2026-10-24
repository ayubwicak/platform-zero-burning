const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getReport, exportReport } = require('../controllers/reportController');

const router = express.Router();

// Admin only - get detailed report
router.get('/api/reports', authenticateToken, getReport);

// Admin only - export report (CSV/JSON)
router.get('/api/reports/export', authenticateToken, exportReport);

module.exports = router;
