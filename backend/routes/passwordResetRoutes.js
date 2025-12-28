const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { body } = require('express-validator');

const validateEmail = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const validateNewPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
];

router.post('/request', validateEmail, passwordResetController.requestPasswordReset);
router.get('/verify/:token', passwordResetController.verifyResetToken);
router.post('/reset', validateNewPassword, passwordResetController.resetPassword);

module.exports = router;
