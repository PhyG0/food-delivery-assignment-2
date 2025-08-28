const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// Get restaurants near user
router.get('/', restaurantController.getRestaurants);

// Get restaurant details with menu
router.get('/:id', restaurantController.getRestaurantById);

module.exports = router;
