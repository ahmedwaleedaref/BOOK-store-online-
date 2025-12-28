const { query } = require('../config/database');

// Get user's wishlist
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const wishlist = await query(
      `SELECT w.wishlist_id, w.added_at, 
              b.isbn, b.title, b.price, b.category, b.quantity_in_stock,
              p.publisher_name,
              GROUP_CONCAT(a.author_name SEPARATOR ', ') AS authors
       FROM WISHLISTS w
       JOIN BOOKS b ON w.book_isbn = b.isbn
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
       WHERE w.user_id = ?
       GROUP BY w.wishlist_id, b.isbn, p.publisher_name
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// Add book to wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.body;

    // Check if book exists
    const books = await query('SELECT isbn FROM BOOKS WHERE isbn = ?', [isbn]);
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if already in wishlist
    const existing = await query(
      'SELECT wishlist_id FROM WISHLISTS WHERE user_id = ? AND book_isbn = ?',
      [userId, isbn]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Book already in wishlist'
      });
    }

    await query(
      'INSERT INTO WISHLISTS (user_id, book_isbn) VALUES (?, ?)',
      [userId, isbn]
    );

    res.status(201).json({
      success: true,
      message: 'Book added to wishlist'
    });
  } catch (error) {
    next(error);
  }
};

// Remove book from wishlist
const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.params;

    const result = await query(
      'DELETE FROM WISHLISTS WHERE user_id = ? AND book_isbn = ?',
      [userId, isbn]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Book removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

// Check if book is in wishlist
const checkWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isbn } = req.params;

    const result = await query(
      'SELECT wishlist_id FROM WISHLISTS WHERE user_id = ? AND book_isbn = ?',
      [userId, isbn]
    );

    res.json({
      success: true,
      data: { inWishlist: result.length > 0 }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
};
