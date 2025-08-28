const Order = require('../models/order');          // your OrderModel (module.exports = class/obj)
const CartModel = require('../models/cart');  // your existing CartModel
const db = require('../config/database');

class OrderController {
  // POST /api/orders/create
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { addressId, paymentMethod, specialInstructions } = req.body;

      // Validate address belongs to user
      const address = await db.get(
        `SELECT id FROM addresses WHERE id = ? AND user_id = ?`,
        [addressId, userId]
      );
      if (!address) {
        return res.status(400).json({ success: false, message: 'Invalid address' });
      }

      // Get cart + items
      const cart = await CartModel.getCartByUserId(userId);
      if (!cart) return res.status(400).json({ success: false, message: 'Cart is empty' });

      const cartItems = await CartModel.getCartItems(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No items in cart' });
      }

      // Restaurant checks + fees
      const restaurant = await db.get(
        `SELECT id, status, min_order_amount, delivery_fee, avg_prep_time
         FROM restaurants WHERE id = ?`,
        [cart.restaurant_id]
      );
      if (!restaurant) {
        return res.status(400).json({ success: false, message: 'Restaurant not found' });
      }
      if (restaurant.status !== 'open') {
        return res.status(409).json({ success: false, message: 'Restaurant is closed' });
      }

      // Totals
      const itemsSubtotal = cartItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      if (itemsSubtotal < restaurant.min_order_amount) {
        return res.status(409).json({
          success: false,
          message: `Minimum order amount is ${restaurant.min_order_amount}`
        });
      }
      const deliveryFee = restaurant.delivery_fee;
      const grandTotal = itemsSubtotal + deliveryFee;

      // Transaction
      await db.beginTransaction();
      try {
        // Create order
        const order = await Order.createOrder(
          userId,
          restaurant.id,
          addressId,
          paymentMethod,
          specialInstructions,
          itemsSubtotal,
          deliveryFee,
          'confirmed'
        );

        // Insert order items using snapshot (name/price from joined cartItems)
        for (const it of cartItems) {
          await Order.addOrderItem(
            order.id,
            it.item_id,
            it.name,          // from JOIN with menu_items
            it.price,         // from JOIN with menu_items
            it.quantity,
            it.special_instructions
          );
        }

        // Tracking
        await Order.addTracking(order.id, 'placed');
        await Order.addTracking(order.id, 'confirmed');

        // Clear cart
        await CartModel.clearCart(cart.id);
        await db.run(`DELETE FROM cart WHERE id = ?`, [cart.id]);

        await db.commit();

        // ETA string from avg_prep_time (e.g., "30-40 minutes")
        const minEta = restaurant.avg_prep_time;
        const maxEta = restaurant.avg_prep_time + 10;

        return res.json({
          success: true,
          orderId: order.id,
          totalAmount: grandTotal,
          estimatedDeliveryTime: `${minEta}-${maxEta} minutes`,
          status: 'confirmed'
        });
      } catch (err) {
        await db.rollback();
        throw err;
      }
    } catch (err) {
      console.error('Create order error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  }

  // GET /api/orders
  static async getOrders(req, res) {
    try {
      const userId = req.user.id;
      // If your model method is named getOrdersByUserId (as in my last model), use that:
      const orders = await (Order.getOrdersByUserId
        ? Order.getOrdersByUserId(userId)
        : Order.getOrdersByUser(userId)); // fallback if you kept the older name
      return res.json({ success: true, orders });
    } catch (err) {
      console.error('Get orders error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/orders/:orderId
  static async getOrderById(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const order = await Order.getOrderById(orderId, userId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      return res.json({ success: true, order });
    } catch (err) {
      console.error('Get order by id error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/orders/:orderId/cancel
  static async cancelOrder(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      // Only allow cancel if not already delivered/cancelled (simple guard)
      const current = await db.get(
        `SELECT status FROM orders WHERE id = ? AND user_id = ?`,
        [orderId, userId]
      );
      if (!current) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (['delivered', 'cancelled'].includes(current.status)) {
        return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
      }

      const result = await Order.cancelOrder(orderId, userId);
      if (!result || result.changes === 0) {
        return res.status(400).json({ success: false, message: 'Order not found or cannot be cancelled' });
      }

      await Order.addTracking(orderId, 'cancelled');
      return res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (err) {
      console.error('Cancel order error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = OrderController;
