const request = require('supertest');
const express = require('express');

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

const { query } = require('../config/database');

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req, res, next) => {
    req.user = { userId: 1, username: 'testuser', userType: 'customer' };
    next();
  });
  
  return app;
};

describe('Books API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    const bookRoutes = require('../routes/bookRoutes');
    app.use('/api/books', bookRoutes);
  });

  describe('GET /api/books', () => {
    it('should return paginated books', async () => {
      const mockBooks = [
        { isbn: '1234567890', title: 'Test Book', price: 19.99 }
      ];
      
      query.mockResolvedValueOnce(mockBooks);
      query.mockResolvedValueOnce([{ total: 1 }]);

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toEqual(mockBooks);
    });

    it('should handle pagination parameters', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([{ total: 0 }]);

      const response = await request(app)
        .get('/api/books?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(2);
    });
  });

  describe('GET /api/books/categories', () => {
    it('should return categories with book counts', async () => {
      const mockCategories = [
        { category: 'Science', book_count: 5 },
        { category: 'History', book_count: 3 }
      ];
      
      query.mockResolvedValueOnce(mockCategories);

      const response = await request(app)
        .get('/api/books/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategories);
    });
  });

  describe('GET /api/books/full-search', () => {
    it('should search books by query', async () => {
      const mockResults = [
        { isbn: '1234567890', title: 'Physics Book', authors: 'John Doe' }
      ];
      
      query.mockResolvedValueOnce(mockResults);
      query.mockResolvedValueOnce([{ total: 1 }]);

      const response = await request(app)
        .get('/api/books/full-search?q=physics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.query).toBe('physics');
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/api/books/full-search')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should apply filters', async () => {
      query.mockResolvedValueOnce([]);
      query.mockResolvedValueOnce([{ total: 0 }]);

      const response = await request(app)
        .get('/api/books/full-search?q=test&category=Science&minPrice=10&maxPrice=50&inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/books/:isbn', () => {
    it('should return book by ISBN', async () => {
      const mockBook = { isbn: '1234567890', title: 'Test Book' };
      query.mockResolvedValueOnce([mockBook]);

      const response = await request(app)
        .get('/api/books/1234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbn).toBe('1234567890');
    });

    it('should return 404 for non-existent book', async () => {
      query.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/books/0000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
