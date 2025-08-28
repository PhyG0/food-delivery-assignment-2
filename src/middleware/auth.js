const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require("../models/user.js")

exports.authenticateToken = async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || 'secret_code', async (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token' 
      });
    }

    const fetchedUser = await User.findByEmail(user.email);

    if(!fetchedUser) {
        res.status(403).json({ message: "User dosenot exist" });
        return;
    }

    // Add user info to request object
    req.user = fetchedUser;
    next();
  });
};
