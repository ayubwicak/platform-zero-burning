const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { getReport, exportReport } = require('../controllers/reportController');

const router = express.Router();

// Admin only - get detailed report
router.get('/api/reports', authenticateToken, authorizeRoles('admin'), getReport);

// Admin only - export report (CSV/JSON)
router.get('/api/reports/export', authenticateToken, authorizeRoles('admin'), exportReport);

module.exports = router;
