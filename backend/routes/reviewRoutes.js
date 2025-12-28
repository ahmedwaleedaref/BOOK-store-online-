const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/book/:isbn', reviewController.getBookReviews);

// Protected routes
router.get('/book/:isbn/my-review', authenticateToken, reviewController.getUserReview);
router.post('/book/:isbn', authenticateToken, reviewController.createReview);
router.delete('/book/:isbn', authenticateToken, reviewController.deleteReview);
router.get('/recommendations', authenticateToken, reviewController.getRecommendations);

module.exports = router;
