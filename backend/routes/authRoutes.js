const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validate } = require('../middleware/validation');
const { body } = require('express-validator');

router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

router.get('/profile', authenticateToken, authController.getProfile);

router.put(
  '/profile',
  authenticateToken,
  [
    body('first_name').optional().trim().isLength({ max: 50 }),
    body('last_name').optional().trim().isLength({ max: 50 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('phone_number').optional().trim()
  ],
  validate,
  authController.updateProfile
);

router.put(
  '/change-password',
  authenticateToken,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number')
  ],
  validate,
  authController.changePassword
);

router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
