const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listCategories,
  createCategory,
  updateCategory,
  listClaims,
  listPendingClaims,
  listDistributions,
  createClaim,
  recordDistribution,
} = require('../controllers/incentiveController');

const router = express.Router();

router.get('/categories', authenticateToken, listCategories);
router.post('/categories', authenticateToken, authorizeRoles('admin'), createCategory);
router.patch('/categories/:id', authenticateToken, authorizeRoles('admin'), updateCategory);
router.get('/claims/pending', authenticateToken, authorizeRoles('petugas', 'admin'), listPendingClaims);
router.get('/claims', authenticateToken, authorizeRoles('petani'), listClaims);
router.post('/claims', authenticateToken, authorizeRoles('petani'), createClaim);
router.get('/distributions', authenticateToken, authorizeRoles('petugas', 'admin'), listDistributions);
router.post('/distributions', authenticateToken, authorizeRoles('petugas', 'admin'), recordDistribution);

module.exports = router;
