const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { listUsers, createUser, updateUserRole } = require('../controllers/userController');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id/role', updateUserRole);

module.exports = router;
