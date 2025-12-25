const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All report routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/sales/previous-month', reportController.getPreviousMonthSales);
router.get('/sales/by-date', reportController.getSalesByDate);
router.get('/sales/daily', reportController.getDailySales);
router.get('/customers/top', reportController.getTopCustomers);
router.get('/books/top', reportController.getTopBooks);
router.get('/books/:isbn/reorders', reportController.getBookReorderCount);
router.get('/inventory/status', reportController.getInventoryStatus);

module.exports = router;
