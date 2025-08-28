const db = require('../config/database');
const User = require('../models/user');

class AddressController {
    /**
     * Add a new delivery address
     */
    static async addAddress(req, res) {
        try {
            const userId = req.user.id;
            const {
                type,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
                latitude,
                longitude
            } = req.body;

            if (!type || !addressLine1 || !city || !state || !pincode || !latitude || !longitude) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const sql = `
                INSERT INTO addresses (user_id, type, address_line1, address_line2, city, state, pincode, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await db.run(sql, [
                userId,
                type,
                addressLine1,
                addressLine2 || null,
                city,
                state,
                pincode,
                latitude,
                longitude
            ]);

            return res.status(201).json({
                success: true,
                message: 'Address added successfully',
                addressId: result.lastID
            });
        } catch (error) {
            console.error('Add address error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Get all user addresses
     */
    static async getAddresses(req, res) {
        try {
            const userId = req.user.id;
            const sql = `SELECT * FROM addresses WHERE user_id = ?`;
            const rows = await db.query(sql, [userId]);

            return res.json({ success: true, addresses: rows });
        } catch (error) {
            console.error('Get addresses error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Set default delivery address
     */
    static async setDefaultAddress(req, res) {
        try {
            const userId = req.user.id;
            const addressId = req.params.id;

            // Verify address belongs to this user
            const address = await db.get(`SELECT * FROM addresses WHERE id = ? AND user_id = ?`, [addressId, userId]);
            if (!address) {
                return res.status(404).json({ success: false, message: 'Address not found' });
            }

            // Update default address
            const updated = await User.setDefaultAddress(userId, addressId);

            if (!updated) {
                return res.status(500).json({ success: false, message: 'Could not set default address' });
            }

            return res.json({ success: true, message: 'Default address updated successfully' });
        } catch (error) {
            console.error('Set default address error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = AddressController;
