const db = require('../config/database');

class RestaurantController {
    /**
     * GET /api/restaurants
     * Nearby restaurants with filters
     */
    static async getRestaurants(req, res) {
        try {
            let { lat, lng, radius = 5, cuisine, search, veg_only, rating } = req.query;

            radius = parseFloat(radius);
            lat = parseFloat(lat);
            lng = parseFloat(lng);

            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
            }

            // Haversine formula
            const distanceFormula = `
                (6371 * acos(
                    cos(radians(?)) * cos(radians(r.latitude)) *
                    cos(radians(r.longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(r.latitude))
                ))
            `;

            let baseSql = `
                SELECT r.*, ${distanceFormula} AS distance
                FROM restaurants r
                WHERE 1=1
            `;
            const params = [lat, lng, lat];

            // Filters
            if (cuisine) {
                baseSql += ` AND r.cuisine LIKE ?`;
                params.push(`%${cuisine}%`);
            }
            if (search) {
                baseSql += ` AND r.name LIKE ?`;
                params.push(`%${search}%`);
            }
            if (veg_only === 'true') {
                // ⚠️ Your schema doesn’t have `veg_only` column, remove this or add a flag in restaurants table
                baseSql += ` AND r.cuisine LIKE '%Veg%'`;
            }
            if (rating) {
                baseSql += ` AND r.rating >= ?`;
                params.push(rating);
            }

            // Instead of HAVING, wrap in subquery
            const sql = `
                SELECT * FROM (
                    ${baseSql}
                ) AS sub
                WHERE distance <= ?
                ORDER BY distance ASC
            `;
            params.push(radius);

            const rows = await db.query(sql, params);

            const restaurants = rows.map(r => ({
                id: r.id,
                name: r.name,
                cuisine: r.cuisine ? r.cuisine.split(',') : [],
                rating: r.rating,
                openingTime: r.opening_time,
                closingTime: r.closing_time,
                minOrderAmount: r.min_order_amount,
                deliveryFee: r.delivery_fee,
                avgPrepTime: r.avg_prep_time,
                status: r.status,
                distance: `${r.distance.toFixed(1)} km`
            }));

            return res.json({
                success: true,
                count: restaurants.length,
                restaurants
            });
        } catch (error) {
            console.error('Get restaurants error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }


    /**
     * GET /api/restaurants/:id
     * Restaurant details + menu
     */
    static async getRestaurantById(req, res) {
        try {
            const { id } = req.params;

            const restaurant = await db.get(`SELECT * FROM restaurants WHERE id = ?`, [id]);
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }

            // Fetch menu categories for this restaurant
            const categories = await db.query(
                `SELECT id, name 
                FROM menu_categories 
                WHERE restaurant_id = ? 
                ORDER BY display_order ASC`,
                [id]
            );

            const menu = [];
            for (const cat of categories) {
                const items = await db.query(
                    `SELECT id, name, description, price, is_veg AS isVeg, 
                            is_available AS isAvailable
                    FROM menu_items 
                    WHERE restaurant_id = ? AND category_id = ?`,
                    [id, cat.id]
                );
                menu.push({
                    category: cat.name,
                    items
                });
            }

            return res.json({
                success: true,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    cuisine: restaurant.cuisine ? restaurant.cuisine.split(',') : [],
                    rating: restaurant.rating,
                    description: restaurant.description,
                    address: restaurant.address,
                    openingTime: restaurant.opening_time,
                    closingTime: restaurant.closing_time,
                    minOrderAmount: restaurant.min_order_amount,
                    deliveryFee: restaurant.delivery_fee,
                    avgPrepTime: restaurant.avg_prep_time,
                    status: restaurant.status,
                    menu
                }
            });
        } catch (error) {
            console.error('Get restaurant by id error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

}

module.exports = RestaurantController;
