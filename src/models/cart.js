const db = require('../config/database');

class CartModel {
    static async getCartByUserId(userId) {
        const cart = await db.get(`SELECT * FROM cart WHERE user_id = ?`, [userId]);
        return cart;
    }

    static async createCart(userId, restaurantId) {
        const result = await db.run(
            `INSERT INTO cart (user_id, restaurant_id) VALUES (?, ?)`,
            [userId, restaurantId]
        );
        return { id: result.lastID, user_id: userId, restaurant_id: restaurantId };
    }

    static async addItem(cartId, itemId, quantity, specialInstructions) {
        const existing = await db.get(
            `SELECT * FROM cart_items WHERE cart_id = ? AND item_id = ?`,
            [cartId, itemId]
        );
        if (existing) {
            await db.run(
                `UPDATE cart_items SET quantity = quantity + ?, special_instructions = ? WHERE id = ?`,
                [quantity, specialInstructions || existing.special_instructions, existing.id]
            );
        } else {
            await db.run(
                `INSERT INTO cart_items (cart_id, item_id, quantity, special_instructions) VALUES (?, ?, ?, ?)`,
                [cartId, itemId, quantity, specialInstructions || null]
            );
        }
    }

    static async getCartItems(cartId) {
        return db.query(
            `SELECT ci.id, ci.item_id, mi.name, mi.price, ci.quantity, ci.special_instructions
             FROM cart_items ci
             JOIN menu_items mi ON ci.item_id = mi.id
             WHERE ci.cart_id = ?`,
            [cartId]
        );
    }

    static async updateItem(cartId, itemId, quantity) {
        return db.run(
            `UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?`,
            [quantity, cartId, itemId]
        );
    }

    static async removeItem(cartId, itemId) {
        return db.run(
            `DELETE FROM cart_items WHERE cart_id = ? AND item_id = ?`,
            [cartId, itemId]
        );
    }

    static async clearCart(cartId) {
        return db.run(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
    }

    static async deleteCart(cartId) {
        return db.run(`DELETE FROM cart WHERE id = ?`, [cartId]);
    }
}

module.exports = CartModel;
