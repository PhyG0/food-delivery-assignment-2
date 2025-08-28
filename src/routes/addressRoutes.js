const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { authenticateToken } = require('../middleware/auth');

// Add delivery address
router.post('/', authenticateToken, addressController.addAddress);

// Get user addresses
router.get('/', authenticateToken, addressController.getAddresses);

// Set default delivery address
router.put('/:id/set-default', authenticateToken, addressController.setDefaultAddress);

module.exports = router;
