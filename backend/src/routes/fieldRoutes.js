const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { listFields, createField, getField } = require('../controllers/fieldController');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('petani'), listFields);
router.post('/', authenticateToken, authorizeRoles('petani'), createField);
router.get('/:id', authenticateToken, getField);

module.exports = router;
