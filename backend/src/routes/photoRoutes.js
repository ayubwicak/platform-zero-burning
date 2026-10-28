const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateGeofencing } = require('../middleware/geofencingMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadPhoto, listMyPhotos } = require('../controllers/photoController');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('petani'), listMyPhotos);
router.post(
  '/',
  authenticateToken,
  authorizeRoles('petani'),
  uploadLimiter,
  upload.single('foto'),
  validateGeofencing,
  uploadPhoto
);

module.exports = router;
