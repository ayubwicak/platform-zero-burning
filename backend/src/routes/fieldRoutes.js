const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listFields,
  createField,
  getField,
  updateField,
  deleteField,
} = require('../controllers/fieldController');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('petani'), listFields);
router.post('/', authenticateToken, authorizeRoles('petani'), createField);
router.get('/:id', authenticateToken, getField);
router.patch('/:id', authenticateToken, authorizeRoles('petani'), updateField);
router.delete('/:id', authenticateToken, authorizeRoles('petani'), deleteField);

module.exports = router;
