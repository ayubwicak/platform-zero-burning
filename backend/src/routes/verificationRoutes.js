const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  communityVerify,
  officialVerify,
  listCommunityPhotos,
  listPhotos,
  listPending,
} = require('../controllers/verificationController');

const router = express.Router();

router.get('/community', authenticateToken, authorizeRoles('petani'), listCommunityPhotos);
router.get('/', authenticateToken, authorizeRoles('petugas', 'admin'), listPhotos);
router.get('/pending', authenticateToken, authorizeRoles('petugas', 'admin'), listPending);
router.post('/community', authenticateToken, authorizeRoles('petani'), communityVerify);
router.post('/official', authenticateToken, authorizeRoles('petugas', 'admin'), officialVerify);

module.exports = router;
