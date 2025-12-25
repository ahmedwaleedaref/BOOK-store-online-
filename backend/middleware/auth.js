const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Check if user still exists
      const users = await query(
        'SELECT user_id, username, email, user_type FROM USERS WHERE user_id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = {
        userId: users[0].user_id,
        username: users[0].username,
        email: users[0].email,
        userType: users[0].user_type
      };

      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }
  next();
};

// Check if user is customer
const requireCustomer = (req, res, next) => {
  if (req.user.userType !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customer account required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer
};
