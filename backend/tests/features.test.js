const request = require('supertest');
const express = require('express');

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../config/database');

// Create test app with auth
const createTestApp = (userType = 'customer') => {
  const app = express();
  app.use(express.json());
  
  app.use((req, res, next) => {
    req.user = { userId: 1, username: 'testuser', userType };
    next();
  });
  
  return app;
};

describe('Wishlist API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    const wishlistRoutes = require('../routes/wishlistRoutes');
    app.use('/api/wishlist', wishlistRoutes);
  });

  describe('GET /api/wishlist', () => {
    it('should return user wishlist', async () => {
      const mockWishlist = [
        { wishlist_id: 1, isbn: '1234567890', title: 'Test Book' }
      ];
      
      query.mockResolvedValueOnce(mockWishlist);

      const response = await request(app)
        .get('/api/wishlist')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockWishlist);
    });
  });

  describe('POST /api/wishlist', () => {
    it('should add book to wishlist', async () => {
      query.mockResolvedValueOnce([{ isbn: '1234567890' }]); // Book exists
      query.mockResolvedValueOnce([]); // Not in wishlist
      query.mockResolvedValueOnce({ insertId: 1 }); // Insert

      const response = await request(app)
        .post('/api/wishlist')
        .send({ isbn: '1234567890' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 if book not found', async () => {
      query.mockResolvedValueOnce([]); // Book doesn't exist

      const response = await request(app)
        .post('/api/wishlist')
        .send({ isbn: '0000000000' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if already in wishlist', async () => {
      query.mockResolvedValueOnce([{ isbn: '1234567890' }]); // Book exists
      query.mockResolvedValueOnce([{ wishlist_id: 1 }]); // Already in wishlist

      const response = await request(app)
        .post('/api/wishlist')
        .send({ isbn: '1234567890' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/wishlist/:isbn', () => {
    it('should remove book from wishlist', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 });

      const response = await request(app)
        .delete('/api/wishlist/1234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 if not in wishlist', async () => {
      query.mockResolvedValueOnce({ affectedRows: 0 });

      const response = await request(app)
        .delete('/api/wishlist/0000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Reviews API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    const reviewRoutes = require('../routes/reviewRoutes');
    app.use('/api/reviews', reviewRoutes);
  });

  describe('GET /api/reviews/book/:isbn', () => {
    it('should return reviews with stats', async () => {
      const mockReviews = [
        { review_id: 1, rating: 5, review_title: 'Great!', username: 'user1' }
      ];
      const mockStats = [{
        total_reviews: 1,
        average_rating: 5,
        five_star: 1,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      }];
      
      query.mockResolvedValueOnce(mockReviews);
      query.mockResolvedValueOnce(mockStats);

      const response = await request(app)
        .get('/api/reviews/book/1234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.stats.averageRating).toBe('5.0');
    });
  });

  describe('POST /api/reviews/book/:isbn', () => {
    it('should create review for purchased book', async () => {
      query.mockResolvedValueOnce([{ isbn: '1234567890' }]); // Book exists
      query.mockResolvedValueOnce([{ order_item_id: 1 }]); // Has purchased
      query.mockResolvedValueOnce([]); // No existing review
      query.mockResolvedValueOnce({ insertId: 1 }); // Insert

      const response = await request(app)
        .post('/api/reviews/book/1234567890')
        .send({ rating: 5, review_title: 'Great!', review_text: 'Loved it!' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject review for non-purchased book', async () => {
      query.mockResolvedValueOnce([{ isbn: '1234567890' }]); // Book exists
      query.mockResolvedValueOnce([]); // Has not purchased

      const response = await request(app)
        .post('/api/reviews/book/1234567890')
        .send({ rating: 5 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
