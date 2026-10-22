const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listCategories,
  listClaims,
  createClaim,
  recordDistribution,
} = require('../controllers/incentiveController');

const router = express.Router();

router.get('/categories', authenticateToken, listCategories);
router.get('/claims', authenticateToken, authorizeRoles('petani'), listClaims);
router.post('/claims', authenticateToken, authorizeRoles('petani'), createClaim);
router.post('/distributions', authenticateToken, authorizeRoles('petugas', 'admin'), recordDistribution);

module.exports = router;
