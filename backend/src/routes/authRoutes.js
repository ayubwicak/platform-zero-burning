const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.patch('/password', authenticateToken, changePassword);

module.exports = router;
