const CartModel = require('../models/cart');
const db = require('../config/database');

class CartController {
    static async addToCart(req, res) {
        try {
            const userId = req.user.id;
            const { restaurantId, itemId, quantity, specialInstructions } = req.body;

            if (!restaurantId || !itemId || !quantity) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }

            let cart = await CartModel.getCartByUserId(userId);

            if (!cart) {
                cart = await CartModel.createCart(userId, restaurantId);
            } else if (cart.restaurant_id !== restaurantId) {
                // If cart exists but from another restaurant, clear it
                await CartModel.clearCart(cart.id);
                cart = await CartModel.createCart(userId, restaurantId);
            }

            await CartModel.addItem(cart.id, itemId, quantity, specialInstructions);

            const items = await CartModel.getCartItems(cart.id);

            const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

            return res.json({
                success: true,
                message: "Item added to cart",
                cartTotal,
                itemCount
            });
        } catch (error) {
            console.error("Add to cart error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    static async getCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await CartModel.getCartByUserId(userId);

            if (!cart) {
                return res.json({ success: true, items: [], cartTotal: 0, itemCount: 0 });
            }

            const items = await CartModel.getCartItems(cart.id);

            const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

            return res.json({
                success: true,
                restaurantId: cart.restaurant_id,
                items,
                cartTotal,
                itemCount
            });
        } catch (error) {
            console.error("Get cart error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    static async updateItem(req, res) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;
            const { quantity } = req.body;

            const cart = await CartModel.getCartByUserId(userId);
            if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

            await CartModel.updateItem(cart.id, itemId, quantity);

            return res.json({ success: true, message: "Cart updated" });
        } catch (error) {
            console.error("Update cart error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    static async removeItem(req, res) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;

            const cart = await CartModel.getCartByUserId(userId);
            if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

            await CartModel.removeItem(cart.id, itemId);

            return res.json({ success: true, message: "Item removed from cart" });
        } catch (error) {
            console.error("Remove cart item error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    static async clearCart(req, res) {
        try {
            const userId = req.user.id;
            const cart = await CartModel.getCartByUserId(userId);
            if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

            await CartModel.clearCart(cart.id);

            return res.json({ success: true, message: "Cart cleared" });
        } catch (error) {
            console.error("Clear cart error:", error);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

module.exports = CartController;
