const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireCustomer, requireAdmin } = require('../middleware/auth');
const { validateId, validate } = require('../middleware/validation');
const { body } = require('express-validator');

router.post(
  '/place-order',
  authenticateToken,
  requireCustomer,
  [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.isbn').trim().notEmpty().withMessage('Each item must have an ISBN'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('credit_card_number').trim().notEmpty().withMessage('Credit card number is required'),
    body('credit_card_expiry').trim().notEmpty().withMessage('Credit card expiry date is required')
  ],
  validate,
  orderController.placeOrder
);

router.get(
  '/my-orders',
  authenticateToken,
  requireCustomer,
  orderController.viewPastOrders
);

router.get(
  '/my-orders/:orderId',
  authenticateToken,
  requireCustomer,
  validateId,
  orderController.viewOrderDetails
);

router.get(
  '/my-orders/:orderId/invoice',
  authenticateToken,
  requireCustomer,
  validateId,
  orderController.downloadInvoice
);

router.get(
  '/',
  authenticateToken,
  requireAdmin,
  orderController.getAllOrders
);

router.get(
  '/publisher-orders',
  authenticateToken,
  requireAdmin,
  orderController.viewPublisherOrders
);

router.put(
  '/publisher-orders/:orderId/confirm',
  authenticateToken,
  requireAdmin,
  validateId,
  orderController.confirmPublisherOrder
);

router.post(
  '/publisher-orders',
  authenticateToken,
  requireAdmin,
  [
    body('book_isbn').trim().notEmpty().withMessage('Book ISBN is required'),
    body('order_quantity').isInt({ min: 1 }).withMessage('Order quantity must be at least 1')
  ],
  validate,
  orderController.placePublisherOrder
);

module.exports = router;
