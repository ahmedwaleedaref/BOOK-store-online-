const { query } = require('../config/database');

// Get reviews for a book
const getBookReviews = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const reviews = await query(
      `SELECT r.review_id, r.rating, r.review_title, r.review_text, 
              r.created_at, r.updated_at,
              u.username, u.first_name, u.last_name
       FROM BOOK_REVIEWS r
       JOIN USERS u ON r.user_id = u.user_id
       WHERE r.book_isbn = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [isbn, limit, offset]
    );

    // Get aggregate stats
    const stats = await query(
      `SELECT COUNT(*) as total_reviews,
              AVG(rating) as average_rating,
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
              SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
              SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
              SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
              SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM BOOK_REVIEWS
       WHERE book_isbn = ?`,
      [isbn]
    );

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews: stats[0].total_reviews,
          averageRating: stats[0].average_rating ? parseFloat(stats[0].average_rating).toFixed(1) : null,
          distribution: {
            5: stats[0].five_star || 0,
            4: stats[0].four_star || 0,
            3: stats[0].three_star || 0,
            2: stats[0].two_star || 0,
            1: stats[0].one_star || 0
          }
        },
        pagination: {
          page,
          limit,
          total: stats[0].total_reviews
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create or update a review
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.params;
    const { rating, review_title, review_text } = req.body;

    // Check if book exists
    const books = await query('SELECT isbn FROM BOOKS WHERE isbn = ?', [isbn]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if user has purchased this book
    const purchases = await query(
      `SELECT oi.order_item_id 
       FROM ORDER_ITEMS oi
       JOIN CUSTOMER_ORDERS co ON oi.order_id = co.order_id
       WHERE co.user_id = ? AND oi.book_isbn = ?`,
      [userId, isbn]
    );

    if (purchases.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only review books you have purchased'
      });
    }

    // Check if user already has a review
    const existingReview = await query(
      'SELECT review_id FROM BOOK_REVIEWS WHERE book_isbn = ? AND user_id = ?',
      [isbn, userId]
    );

    if (existingReview.length > 0) {
      // Update existing review
      await query(
        `UPDATE BOOK_REVIEWS 
         SET rating = ?, review_title = ?, review_text = ?
         WHERE book_isbn = ? AND user_id = ?`,
        [rating, review_title, review_text, isbn, userId]
      );

      res.json({
        success: true,
        message: 'Review updated successfully'
      });
    } else {
      // Create new review
      await query(
        `INSERT INTO BOOK_REVIEWS (book_isbn, user_id, rating, review_title, review_text)
         VALUES (?, ?, ?, ?, ?)`,
        [isbn, userId, rating, review_title, review_text]
      );

      res.status(201).json({
        success: true,
        message: 'Review created successfully'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Delete a review
const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.params;

    const result = await query(
      'DELETE FROM BOOK_REVIEWS WHERE book_isbn = ? AND user_id = ?',
      [isbn, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get user's review for a book
const getUserReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.params;

    const reviews = await query(
      `SELECT review_id, rating, review_title, review_text, created_at, updated_at
       FROM BOOK_REVIEWS
       WHERE book_isbn = ? AND user_id = ?`,
      [isbn, userId]
    );

    res.json({
      success: true,
      data: reviews[0] || null
    });
  } catch (error) {
    next(error);
  }
};

// Get recommendations based on purchase history
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 8;

    // Get books frequently bought together with books user has purchased
    // "Customers who bought X also bought Y"
    const recommendations = await query(
      `SELECT DISTINCT b.*, p.publisher_name,
              GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT r.review_id) as review_count
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
       LEFT JOIN BOOK_REVIEWS r ON b.isbn = r.book_isbn
       WHERE b.isbn IN (
         -- Books bought by other users who bought the same books as current user
         SELECT DISTINCT oi2.book_isbn
         FROM ORDER_ITEMS oi1
         JOIN CUSTOMER_ORDERS co1 ON oi1.order_id = co1.order_id
         JOIN CUSTOMER_ORDERS co2 ON co1.user_id != co2.user_id
         JOIN ORDER_ITEMS oi2 ON co2.order_id = oi2.order_id
         WHERE co1.user_id = ?
         AND oi2.book_isbn NOT IN (
           -- Exclude books user already bought
           SELECT oi3.book_isbn
           FROM ORDER_ITEMS oi3
           JOIN CUSTOMER_ORDERS co3 ON oi3.order_id = co3.order_id
           WHERE co3.user_id = ?
         )
       )
       AND b.quantity_in_stock > 0
       GROUP BY b.isbn, p.publisher_name
       ORDER BY avg_rating DESC, review_count DESC
       LIMIT ?`,
      [userId, userId, limit]
    );

    // If not enough recommendations, add popular books
    if (recommendations.length < limit) {
      const remaining = limit - recommendations.length;
      const excludeIsbns = recommendations.map(r => r.isbn);
      
      const popular = await query(
        `SELECT b.*, p.publisher_name,
                GROUP_CONCAT(DISTINCT a.author_name SEPARATOR ', ') AS authors,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.review_id) as review_count
         FROM BOOKS b
         JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
         LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
         LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
         LEFT JOIN BOOK_REVIEWS r ON b.isbn = r.book_isbn
         WHERE b.quantity_in_stock > 0
         ${excludeIsbns.length > 0 ? `AND b.isbn NOT IN (${excludeIsbns.map(() => '?').join(',')})` : ''}
         AND b.isbn NOT IN (
           SELECT oi.book_isbn
           FROM ORDER_ITEMS oi
           JOIN CUSTOMER_ORDERS co ON oi.order_id = co.order_id
           WHERE co.user_id = ?
         )
         GROUP BY b.isbn, p.publisher_name
         ORDER BY avg_rating DESC, review_count DESC
         LIMIT ?`,
        [...excludeIsbns, userId, remaining]
      );
      
      recommendations.push(...popular);
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookReviews,
  createReview,
  deleteReview,
  getUserReview,
  getRecommendations
};
