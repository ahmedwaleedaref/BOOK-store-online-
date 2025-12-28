const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  validateBook,
  validateSearch,
  validateIsbn
} = require('../middleware/validation');

router.get('/', bookController.getAllBooks);
router.get('/categories', bookController.getCategories);
router.get('/full-search', bookController.fullTextSearch);
router.get('/category/:category', bookController.getBooksByCategory);
router.get('/search', validateSearch, bookController.searchBooks);
router.get('/:isbn', validateIsbn, bookController.getBookByIsbn);

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateBook,
  bookController.addBook
);

router.put(
  '/:isbn',
  authenticateToken,
  requireAdmin,
  validateIsbn,
  bookController.updateBook
);

module.exports = router;
