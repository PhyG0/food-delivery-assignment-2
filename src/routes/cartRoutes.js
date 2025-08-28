const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// Cart Routes
router.post('/add', authenticateToken, CartController.addToCart);
router.get('/', authenticateToken, CartController.getCart);
router.put('/update/:itemId', authenticateToken, CartController.updateItem);
router.delete('/remove/:itemId', authenticateToken, CartController.removeItem);
router.delete('/clear', authenticateToken, CartController.clearCart);

module.exports = router;
