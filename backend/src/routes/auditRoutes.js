const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { listAuditLogs, exportAuditLogs } = require('../controllers/auditController');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', listAuditLogs);
router.get('/export', exportAuditLogs);

module.exports = router;
