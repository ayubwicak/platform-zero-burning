const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { listAuditLogs } = require('../controllers/auditController');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', listAuditLogs);

module.exports = router;
