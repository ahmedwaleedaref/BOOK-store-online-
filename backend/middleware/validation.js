const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Book validation rules
const validateBook = [
  body('isbn')
    .trim()
    .isLength({ min: 10, max: 13 })
    .withMessage('ISBN must be 10-13 characters'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('publisher_id')
    .isInt({ min: 1 })
    .withMessage('Valid publisher ID is required'),
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid publication year'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  body('category')
    .isIn(['Science', 'Art', 'Religion', 'History', 'Geography'])
    .withMessage('Invalid category'),
  body('quantity_in_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be non-negative'),
  body('threshold_quantity')
    .isInt({ min: 0 })
    .withMessage('Threshold must be non-negative'),
  validate
];

// User registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('phone_number')
    .optional()
    .trim()
    .matches(/^[0-9\-\+\(\)\s]+$/)
    .withMessage('Invalid phone number format'),
  validate
];

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Add to cart validation
const validateAddToCart = [
  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  validate
];

// Checkout validation
const validateCheckout = [
  body('shipping_address_id')
    .isInt({ min: 1 })
    .withMessage('Valid shipping address is required'),
  body('card_last4')
    .trim()
    .isLength({ min: 4, max: 4 })
    .isNumeric()
    .withMessage('Card last 4 digits required'),
  body('card_type')
    .isIn(['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'])
    .withMessage('Invalid card type'),
  body('expiry_month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Invalid expiry month'),
  body('expiry_year')
    .isInt({ min: new Date().getFullYear() })
    .withMessage('Invalid expiry year'),
  validate
];

// Search validation
const validateSearch = [
  query('type')
    .isIn(['ISBN', 'TITLE', 'AUTHOR', 'CATEGORY', 'PUBLISHER'])
    .withMessage('Invalid search type'),
  query('value')
    .trim()
    .notEmpty()
    .withMessage('Search value is required'),
  validate
];

// ISBN parameter validation
const validateIsbn = [
  param('isbn')
    .trim()
    .isLength({ min: 10, max: 13 })
    .withMessage('Invalid ISBN'),
  validate
];

// ID parameter validation (supports routes that use :id or :orderId)
const validateId = [
  param('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
  param('orderId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid order ID'),
  validate
];

module.exports = {
  validate,
  validateBook,
  validateRegistration,
  validateLogin,
  validateAddToCart,
  validateCheckout,
  validateSearch,
  validateIsbn,
  validateId
};
