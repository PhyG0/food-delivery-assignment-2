const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create', authenticateToken, OrderController.createOrder);
router.get('/', authenticateToken, OrderController.getOrders);
router.get('/:orderId', authenticateToken, OrderController.getOrderById);
router.post('/:orderId/cancel', authenticateToken, OrderController.cancelOrder);

module.exports = router;
