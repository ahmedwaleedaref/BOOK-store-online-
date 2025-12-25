const { query } = require('../config/database');

// Add new book (Admin only)
const addBook = async (req, res, next) => {
  try {
    const {
      isbn,
      title,
      publisher_id,
      publication_year,
      price,
      category,
      quantity_in_stock,
      threshold_quantity,
      author_ids // Array of author IDs
    } = req.body;

    // Verify user is admin (already checked in middleware, but double-check)
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin privileges required'
      });
    }

    // Insert new book
    await query(
      `INSERT INTO BOOKS (isbn, title, publisher_id, publication_year, 
                          price, category, quantity_in_stock, threshold_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, publisher_id, publication_year || null, price, category,
       quantity_in_stock || 0, threshold_quantity]
    );

    // Add authors if provided
    if (author_ids && author_ids.length > 0) {
      for (const authorId of author_ids) {
        await query(
          'INSERT INTO BOOK_AUTHORS (book_isbn, author_id) VALUES (?, ?)',
          [isbn, authorId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: { isbn }
    });
  } catch (error) {
    next(error);
  }
};

// Update book (Admin only)
const updateBook = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const { price, quantity_in_stock } = req.body;

    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin privileges required'
      });
    }

    const result = await query(
      `UPDATE BOOKS
       SET price = COALESCE(?, price),
           quantity_in_stock = COALESCE(?, quantity_in_stock)
       WHERE isbn = ?`,
      [price, quantity_in_stock, isbn]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Search books
const searchBooks = async (req, res, next) => {
  try {
    const { type, value } = req.query;

    let sql;
    let params = [];

    const baseSelect = `
      SELECT b.*, p.publisher_name,
             GROUP_CONCAT(a.author_name SEPARATOR ', ') AS authors
      FROM BOOKS b
      JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
      LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
      LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
    `;

    switch (type.toUpperCase()) {
      case 'ISBN':
        sql = baseSelect + ' WHERE b.isbn = ? GROUP BY b.isbn, p.publisher_name';
        params = [value];
        break;
      
      case 'TITLE':
        sql = baseSelect + ' WHERE b.title LIKE ? GROUP BY b.isbn, p.publisher_name';
        params = [`%${value}%`];
        break;
      
      case 'AUTHOR':
        sql = baseSelect + ' WHERE a.author_name LIKE ? GROUP BY b.isbn, p.publisher_name';
        params = [`%${value}%`];
        break;
      
      case 'CATEGORY':
        sql = baseSelect + ' WHERE b.category = ? GROUP BY b.isbn, p.publisher_name';
        params = [value];
        break;
      
      case 'PUBLISHER':
        sql = baseSelect + ' WHERE p.publisher_name LIKE ? GROUP BY b.isbn, p.publisher_name';
        params = [`%${value}%`];
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid search type. Use: ISBN, TITLE, AUTHOR, CATEGORY, or PUBLISHER'
        });
    }

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get book by ISBN
const getBookByIsbn = async (req, res, next) => {
  try {
    const { isbn } = req.params;

    const books = await query(
      `SELECT b.*, p.publisher_name,
              GROUP_CONCAT(a.author_name SEPARATOR ', ') AS authors
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
       WHERE b.isbn = ?
       GROUP BY b.isbn, p.publisher_name`,
      [isbn]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: books[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get all books (with pagination)
const getAllBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const books = await query(
      `SELECT b.*, p.publisher_name,
              GROUP_CONCAT(a.author_name SEPARATOR ', ') AS authors
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
       GROUP BY b.isbn, p.publisher_name
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count
    const countResult = await query('SELECT COUNT(*) AS total FROM BOOKS');
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get books by category
const getBooksByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const books = await query(
      `SELECT b.*, p.publisher_name,
              GROUP_CONCAT(a.author_name SEPARATOR ', ') AS authors
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       LEFT JOIN AUTHORS a ON ba.author_id = a.author_id
       WHERE b.category = ?
       GROUP BY b.isbn, p.publisher_name
       ORDER BY b.title`,
      [category]
    );

    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await query(
      `SELECT DISTINCT category, COUNT(*) AS book_count
       FROM BOOKS
       GROUP BY category
       ORDER BY category`
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBook,
  updateBook,
  searchBooks,
  getBookByIsbn,
  getAllBooks,
  getBooksByCategory,
  getCategories
};
