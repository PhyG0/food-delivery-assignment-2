const db = require('../config/database');

class OrderModel {
    // Create order
    static async createOrder(userId, restaurantId, addressId, paymentMethod, specialInstructions, totalAmount, deliveryFee, status = 'confirmed') {
        const result = await db.run(
            `INSERT INTO orders (user_id, restaurant_id, address_id, status, total_amount, delivery_fee, payment_method, special_instructions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, restaurantId, addressId, status, totalAmount, deliveryFee, paymentMethod, specialInstructions || null]
        );
        return { id: result.lastID };
    }

    // Add items to order_items table
    static async addOrderItem(orderId, itemId, name, price, quantity, specialInstructions) {
        await db.run(
            `INSERT INTO order_items (order_id, item_id, name, price, quantity, special_instructions)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, itemId, name, price, quantity, specialInstructions || null]
        );
    }

    // Add tracking status
    static async addTracking(orderId, status) {
        await db.run(
            `INSERT INTO order_tracking (order_id, status) VALUES (?, ?)`,
            [orderId, status]
        );
    }

    // Get all orders for a user
    static async getOrdersByUserId(userId) {
        return db.query(
            `SELECT o.id as orderId, r.name as restaurantName, COUNT(oi.id) as items, 
                    o.total_amount as totalAmount, o.status, o.created_at as orderedAt
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
    }

    // Get single order with details
    static async getOrderById(orderId, userId) {
        const order = await db.get(
            `SELECT o.*, r.name as restaurantName, r.address as restaurantAddress, r.id as restaurantId,
                    a.address_line1 || ', ' || a.city || ', ' || a.state || ' - ' || a.pincode as deliveryAddress
             FROM orders o
             JOIN restaurants r ON o.restaurant_id = r.id
             JOIN addresses a ON o.address_id = a.id
             WHERE o.id = ? AND o.user_id = ?`,
            [orderId, userId]
        );

        if (!order) return null;

        const items = await db.query(
            `SELECT name, price, quantity, special_instructions as specialInstructions
             FROM order_items
             WHERE order_id = ?`,
            [orderId]
        );

        const tracking = await db.query(
            `SELECT status, timestamp
             FROM order_tracking
             WHERE order_id = ?
             ORDER BY timestamp ASC`,
            [orderId]
        );

        return { ...order, items, tracking };
    }

    // Cancel order
    static async cancelOrder(orderId, userId) {
        return db.run(
            `UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_id = ?`,
            [orderId, userId]
        );
    }
}

module.exports = OrderModel;
