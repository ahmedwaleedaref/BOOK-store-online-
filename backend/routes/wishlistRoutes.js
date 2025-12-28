const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authenticateToken);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.get('/:isbn', wishlistController.checkWishlist);
router.delete('/:isbn', wishlistController.removeFromWishlist);

module.exports = router;
