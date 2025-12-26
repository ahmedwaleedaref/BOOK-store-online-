const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate JWT token
const generateToken = (userId, username, userType) => {
  return jwt.sign(
    { userId, username, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new customer (NO CART CREATION)
const register = async (req, res, next) => {
  try {
    const {
      username,
      password,
      email,
      first_name,
      last_name,
      phone_number,
      address
    } = req.body;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new customer user (NO shopping cart creation)
    const result = await query(
      `INSERT INTO USERS (username, password_hash, email, first_name, 
                          last_name, phone_number, address, user_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')`,
      [username, password_hash, email, first_name, last_name, phone_number, address]
    );

    const userId = result.insertId;

    // Generate token
    const token = generateToken(userId, username, 'customer');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId,
        username,
        email,
        userType: 'customer',
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Get user from database
    const users = await query(
      `SELECT user_id, username, password_hash, email, user_type
       FROM USERS 
       WHERE username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken(user.user_id, user.username, user.user_type);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        userType: user.user_type,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const users = await query(
      `SELECT user_id, username, email, first_name, last_name, 
              phone_number, address, user_type
       FROM USERS WHERE user_id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone_number, address } = req.body;
    const userId = req.user.userId;

    await query(
      `UPDATE USERS 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           email = COALESCE(?, email),
           phone_number = COALESCE(?, phone_number),
           address = COALESCE(?, address)
       WHERE user_id = ?`,
      [first_name, last_name, email, phone_number, address, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    // Get current password hash
    const users = await query(
      'SELECT password_hash FROM USERS WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      users[0].password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE USERS SET password_hash = ? WHERE user_id = ?',
      [new_password_hash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Logout (no cart to clear)
const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
