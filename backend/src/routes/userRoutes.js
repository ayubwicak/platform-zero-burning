const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
