// src/controllers/searchController.js
const SearchModel = require('../models/search');
const db = require('../config/database');

/**
 * Helper: Haversine distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class SearchController {
  /**
   * GET /api/search
   * Query params:
   * - query (required)
   * - lat (optional)
   * - lng (optional)
   */
  static async search(req, res) {
    try {
      const q = (req.query.query || '').trim();
      const lat = req.query.lat ? parseFloat(req.query.lat) : null;
      const lng = req.query.lng ? parseFloat(req.query.lng) : null;

      if (!q) {
        return res.status(400).json({ success: false, message: 'query parameter is required' });
      }

      // Fetch matches from DB (no distance calc in SQL)
      const [rawRestaurants, rawDishes] = await Promise.all([
        SearchModel.searchRestaurants(q),
        SearchModel.searchDishes(q)
      ]);

      // Process restaurants
      let restaurants = rawRestaurants.map(r => {
        const cuisineArr = r.cuisine ? r.cuisine.split(',').map(s => s.trim()) : [];
        const avgDeliveryTime = r.avg_prep_time ? `${r.avg_prep_time}-${r.avg_prep_time + 10} mins` : null;
        const base = {
          id: r.id,
          name: r.name,
          cuisine: cuisineArr,
          rating: r.rating,
          avgDeliveryTime,
          minOrder: r.min_order_amount,
          deliveryFee: r.delivery_fee,
          isOpen: r.status === 'open',
          address: r.address
        };

        if (lat !== null && lng !== null && r.latitude != null && r.longitude != null) {
          const dist = haversineDistance(lat, lng, Number(r.latitude), Number(r.longitude));
          base.distance = `${dist.toFixed(1)} km`;
          base._distanceVal = dist; // for sorting/filtering internally
        }

        return base;
      });

      // If lat/lng provided, sort by distance ascending
      if (lat !== null && lng !== null) {
        restaurants.sort((a, b) => (a._distanceVal || 0) - (b._distanceVal || 0));
      }

      // Process dishes
      let dishes = rawDishes.map(d => {
        const out = {
          itemId: d.itemId,
          name: d.itemName,
          description: d.itemDescription,
          restaurantId: d.restaurantId,
          restaurantName: d.restaurantName,
          price: d.price,
          rating: d.restaurantRating,
          isVeg: !!d.isVeg,
          isAvailable: d.isAvailable === 1
        };

        if (lat !== null && lng !== null && d.restaurantLat != null && d.restaurantLng != null) {
          const dist = haversineDistance(lat, lng, Number(d.restaurantLat), Number(d.restaurantLng));
          out.distance = `${dist.toFixed(1)} km`;
          out._distanceVal = dist;
        }

        return out;
      });

      // If lat/lng provided, sort dishes by distance ascending
      if (lat !== null && lng !== null) {
        dishes.sort((a, b) => (a._distanceVal || 0) - (b._distanceVal || 0));
      }

      // Clean up internal distance fields before sending
      restaurants = restaurants.map(r => {
        if (r._distanceVal !== undefined) delete r._distanceVal;
        return r;
      });
      dishes = dishes.map(d => {
        if (d._distanceVal !== undefined) delete d._distanceVal;
        return d;
      });

      return res.json({
        success: true,
        restaurants,
        dishes
      });
    } catch (err) {
      console.error('Search error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = SearchController;
