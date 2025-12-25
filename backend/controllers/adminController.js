const { query } = require('../config/database');

// ============ PUBLISHER CONTROLLER ============

// Get all publishers
const getAllPublishers = async (req, res, next) => {
  try {
    const publishers = await query(
      `SELECT p.*, COUNT(b.isbn) AS book_count
       FROM PUBLISHERS p
       LEFT JOIN BOOKS b ON p.publisher_id = b.publisher_id
       GROUP BY p.publisher_id
       ORDER BY p.publisher_name`
    );

    res.json({
      success: true,
      data: publishers
    });
  } catch (error) {
    next(error);
  }
};

// Get publisher by ID
const getPublisherById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const publishers = await query(
      'SELECT * FROM PUBLISHERS WHERE publisher_id = ?',
      [id]
    );

    if (publishers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Publisher not found'
      });
    }

    res.json({
      success: true,
      data: publishers[0]
    });
  } catch (error) {
    next(error);
  }
};

// Add new publisher (Admin)
const addPublisher = async (req, res, next) => {
  try {
    const { publisher_name, address, phone_number } = req.body;

    const result = await query(
      `INSERT INTO PUBLISHERS (publisher_name, address, phone_number)
       VALUES (?, ?, ?)`,
      [publisher_name, address || null, phone_number || null]
    );

    res.status(201).json({
      success: true,
      message: 'Publisher added successfully',
      data: {
        publisherId: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update publisher (Admin)
const updatePublisher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publisher_name, address, phone_number } = req.body;

    const result = await query(
      `UPDATE PUBLISHERS 
       SET publisher_name = COALESCE(?, publisher_name),
           address = ?,
           phone_number = ?
       WHERE publisher_id = ?`,
      [publisher_name, address, phone_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Publisher not found'
      });
    }

    res.json({
      success: true,
      message: 'Publisher updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete publisher (Admin)
const deletePublisher = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if publisher has books
    const books = await query(
      'SELECT COUNT(*) AS count FROM BOOKS WHERE publisher_id = ?',
      [id]
    );

    if (books[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete publisher - books exist for this publisher'
      });
    }

    const result = await query(
      'DELETE FROM PUBLISHERS WHERE publisher_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Publisher not found'
      });
    }

    res.json({
      success: true,
      message: 'Publisher deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ AUTHOR CONTROLLER ============

// Get all authors
const getAllAuthors = async (req, res, next) => {
  try {
    const authors = await query(
      `SELECT a.*, COUNT(ba.book_isbn) AS book_count
       FROM AUTHORS a
       LEFT JOIN BOOK_AUTHORS ba ON a.author_id = ba.author_id
       GROUP BY a.author_id
       ORDER BY a.author_name`
    );

    res.json({
      success: true,
      data: authors
    });
  } catch (error) {
    next(error);
  }
};

// Get author by ID
const getAuthorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const authors = await query(
      'SELECT * FROM AUTHORS WHERE author_id = ?',
      [id]
    );

    if (authors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Get author's books
    const books = await query(
      `SELECT b.isbn, b.title, b.publication_year, b.category
       FROM BOOKS b
       JOIN BOOK_AUTHORS ba ON b.isbn = ba.book_isbn
       WHERE ba.author_id = ?
       ORDER BY b.publication_year DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...authors[0],
        books
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add new author (Admin)
const addAuthor = async (req, res, next) => {
  try {
    const { author_name } = req.body;

    const result = await query(
      'INSERT INTO AUTHORS (author_name) VALUES (?)',
      [author_name]
    );

    res.status(201).json({
      success: true,
      message: 'Author added successfully',
      data: {
        authorId: result.insertId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update author (Admin)
const updateAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { author_name } = req.body;

    const result = await query(
      'UPDATE AUTHORS SET author_name = ? WHERE author_id = ?',
      [author_name, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.json({
      success: true,
      message: 'Author updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete author (Admin)
const deleteAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if author has books
    const books = await query(
      'SELECT COUNT(*) AS count FROM BOOK_AUTHORS WHERE author_id = ?',
      [id]
    );

    if (books[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete author - books exist for this author'
      });
    }

    const result = await query(
      'DELETE FROM AUTHORS WHERE author_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.json({
      success: true,
      message: 'Author deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Publishers
  getAllPublishers,
  getPublisherById,
  addPublisher,
  updatePublisher,
  deletePublisher,
  // Authors
  getAllAuthors,
  getAuthorById,
  addAuthor,
  updateAuthor,
  deleteAuthor
};
