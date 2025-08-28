const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Add review
router.post('/restaurant', authenticateToken, ReviewController.addRestaurantReview);

// Get reviews for a restaurant
router.get('/restaurant/:restaurantId', ReviewController.getRestaurantReviews);

module.exports = router;
