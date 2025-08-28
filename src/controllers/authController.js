// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_code'; 
const JWT_EXPIRES_IN = '7d';

class AuthController {
    /**
     * Register a new user
     */
    static async register(req, res) {
        try {
            const { name, email, password, phone } = req.body;

            if (!name || !email || !password || !phone) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Email already registered' });
            }

            // Create user
            const newUser = await User.create({ name, email, password, phone });

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                userId: newUser.id
            });
        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Login user
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            const validPassword = await User.verifyPassword(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Logout user (handled client-side by clearing token)
     */
    static async logout(req, res) {
        // With JWT, logout is typically handled client-side by removing the token.
        return res.json({ success: true, message: 'Logged out successfully' });
    }

    /**
     * Get user profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.id; // from authenticateToken middleware
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    default_address_id: user.default_address_id
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, phone, password } = req.body;

            const updated = await User.update(userId, { name, phone, password });
            if (!updated) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            const user = await User.findById(userId);

            return res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = AuthController;
