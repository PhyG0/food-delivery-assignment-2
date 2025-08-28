const db = require('../config/database');

class ReviewModel {
    static async addReview(orderId, restaurantId, restaurantRating, foodRating, deliveryRating, comment) {
        const result = await db.run(
            `INSERT INTO reviews 
             (order_id, restaurant_id, restaurant_rating, food_rating, delivery_rating, comment) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, restaurantId, restaurantRating, foodRating, deliveryRating, comment]
        );
        return { id: result.lastID };
    }

    static async getReviewsByRestaurant(restaurantId) {
        return db.query(
            `SELECT r.id, r.restaurant_rating, r.food_rating, r.delivery_rating, r.comment, r.created_at,
                    u.name AS user_name
             FROM reviews r
             JOIN orders o ON r.order_id = o.id
             JOIN users u ON o.user_id = u.id
             WHERE r.restaurant_id = ?
             ORDER BY r.created_at DESC`,
            [restaurantId]
        );
    }

    static async getReviewByOrder(orderId) {
        return db.get(
            `SELECT * FROM reviews WHERE order_id = ?`,
            [orderId]
        );
    }
}

module.exports = ReviewModel;
