const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendOTPVerification,
  verifyEmailWithOTP,
  resendOTPVerification,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.patch('/password', authenticateToken, changePassword);
router.post('/send-otp', sendOTPVerification);
router.post('/verify-email', verifyEmailWithOTP);
router.post('/resend-otp', resendOTPVerification);

module.exports = router;
