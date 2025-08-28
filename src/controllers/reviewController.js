const ReviewModel = require('../models/review');
const db = require('../config/database');

class ReviewController {
    // POST /api/reviews/restaurant
    static async addRestaurantReview(req, res) {
        try {
            const userId = req.user.id;
            const { orderId, restaurantRating, foodRating, deliveryRating, comment } = req.body;

            // 1. Check if order exists and belongs to user
            const order = await db.get(
                `SELECT id, restaurant_id FROM orders WHERE id = ? AND user_id = ?`,
                [orderId, userId]
            );
            if (!order) {
                return res.status(400).json({ success: false, message: "Invalid order" });
            }

            // 2. Ensure review doesn’t already exist
            const existing = await ReviewModel.getReviewByOrder(orderId);
            if (existing) {
                return res.status(400).json({ success: false, message: "Review already submitted" });
            }

            // 3. Save review
            const review = await ReviewModel.addReview(
                orderId,
                order.restaurant_id,
                restaurantRating,
                foodRating,
                deliveryRating,
                comment
            );

            return res.json({ success: true, reviewId: review.id });
        } catch (err) {
            console.error("Add review error:", err);
            return res.status(500).json({ success: false, message: "Failed to add review" });
        }
    }

    // GET /api/reviews/restaurant/:restaurantId
    static async getRestaurantReviews(req, res) {
        try {
            const { restaurantId } = req.params;
            const reviews = await ReviewModel.getReviewsByRestaurant(restaurantId);
            return res.json({ success: true, reviews });
        } catch (err) {
            console.error("Get reviews error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
        }
    }
}

module.exports = ReviewController;
