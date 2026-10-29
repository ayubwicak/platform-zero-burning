const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

module.exports = router;
