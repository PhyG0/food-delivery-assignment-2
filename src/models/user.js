// src/models/user.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    /**
     * Create a new user
     * @param {Object} userData - { name, email, password, phone }
     * @returns {Object} inserted user with id
     */
    static async create({ name, email, password, phone }) {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, phone)
            VALUES (?, ?, ?, ?)
        `;

        const result = await db.run(sql, [name, email, hashedPassword, phone]);
        return { id: result.lastID, name, email, phone };
    }

    /**
     * Find user by email
     * @param {string} email 
     * @returns {Object|null}
     */
    static async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
        return db.get(sql, [email]);
    }

    /**
     * Find user by ID
     * @param {number} id 
     * @returns {Object|null}
     */
    static async findById(id) {
        const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
        return db.get(sql, [id]);
    }

    /**
     * Verify password for a user
     * @param {string} plainPassword 
     * @param {string} hashedPassword 
     * @returns {boolean}
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Update default address
     * @param {number} userId 
     * @param {number} addressId 
     * @returns {boolean}
     */
    static async setDefaultAddress(userId, addressId) {
        const sql = `UPDATE users SET default_address_id = ? WHERE id = ?`;
        const result = await db.run(sql, [addressId, userId]);
        return result.changes > 0;
    }

    /**
     * Update user profile
     * @param {number} id 
     * @param {Object} data - fields to update (name, phone, password)
     * @returns {boolean}
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.name) {
            fields.push("name = ?");
            values.push(data.name);
        }
        if (data.phone) {
            fields.push("phone = ?");
            values.push(data.phone);
        }
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            fields.push("password = ?");
            values.push(hashedPassword);
        }

        if (fields.length === 0) return false;

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const result = await db.run(sql, values);
        return result.changes > 0;
    }

    /**
     * Delete user
     * @param {number} id 
     * @returns {boolean}
     */
    static async delete(id) {
        const sql = `DELETE FROM users WHERE id = ?`;
        const result = await db.run(sql, [id]);
        return result.changes > 0;
    }
}

module.exports = User;
