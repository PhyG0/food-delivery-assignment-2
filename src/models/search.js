// src/models/search.js
const db = require('../config/database');

module.exports = {
  /**
   * Search restaurants by name or cuisine
   * @param {string} q
   * @returns {Promise<Array>}
   */
  async searchRestaurants(q) {
    const sql = `
      SELECT id, name, cuisine, description, address, latitude, longitude,
             opening_time, closing_time, min_order_amount, delivery_fee, avg_prep_time,
             status, rating
      FROM restaurants
      WHERE name LIKE ? OR cuisine LIKE ?
    `;
    const like = `%${q}%`;
    return db.query(sql, [like, like]);
  },

  /**
   * Search dishes (menu_items) by name and include restaurant info
   * @param {string} q
   * @returns {Promise<Array>}
   */
  async searchDishes(q) {
    const sql = `
      SELECT mi.id AS itemId,
             mi.name AS itemName,
             mi.description AS itemDescription,
             mi.price AS price,
             mi.is_veg AS isVeg,
             mi.is_available AS isAvailable,
             r.id AS restaurantId,
             r.name AS restaurantName,
             r.latitude AS restaurantLat,
             r.longitude AS restaurantLng,
             r.rating AS restaurantRating
      FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.name LIKE ?
    `;
    const like = `%${q}%`;
    return db.query(sql, [like]);
  }
};
