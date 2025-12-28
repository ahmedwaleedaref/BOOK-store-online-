const { query, transaction } = require('../config/database');
const { validateCard } = require('../utils/creditCard');
const { sendOrderConfirmation } = require('../services/emailService');
const { generateInvoice } = require('../services/invoiceService');

const placeOrder = async (req, res, next) => {
  try {
    const { items, credit_card_number, credit_card_expiry } = req.body;
    const userId = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const cardValidation = validateCard({
      creditCardNumber: credit_card_number,
      creditCardExpiry: credit_card_expiry
    });

    if (!cardValidation.ok) {
      return res.status(400).json({
        success: false,
        message: cardValidation.message
      });
    }

    let orderItems = [];
    const orderId = await transaction(async (conn) => {
      let totalAmount = 0;

      for (const item of items) {
        const [rows] = await conn.query(
          'SELECT isbn, title, price, quantity_in_stock FROM BOOKS WHERE isbn = ?',
          [item.isbn]
        );

        const book = rows && rows.length > 0 ? rows[0] : null;

        if (!book) {
          const err = new Error(`Book ${item.isbn} not found`);
          err.status = 400;
          throw err;
        }

        if (book.quantity_in_stock < item.quantity) {
          const err = new Error(
            `Insufficient stock for ${item.isbn}. Available: ${book.quantity_in_stock}`
          );
          err.status = 400;
          throw err;
        }

        orderItems.push({
          isbn: item.isbn,
          title: book.title,
          quantity: item.quantity,
          price: book.price
        });

        totalAmount += book.price * item.quantity;
      }

      const [orderResult] = await conn.query(
        'INSERT INTO CUSTOMER_ORDERS (user_id, total_amount, credit_card_number, credit_card_expiry) VALUES (?, ?, ?, ?)',
        [userId, totalAmount, cardValidation.maskedNumber, cardValidation.normalizedExpiry]
      );

      const newOrderId = orderResult.insertId;

      for (const orderItem of orderItems) {
        await conn.query(
          `INSERT INTO ORDER_ITEMS (order_id, book_isbn, quantity, price_at_purchase)
           VALUES (?, ?, ?, ?)`,
          [newOrderId, orderItem.isbn, orderItem.quantity, orderItem.price]
        );
      }

      return newOrderId;
    });

    // Get user info for email
    const users = await query(
      'SELECT username, email, first_name, last_name, address FROM USERS WHERE user_id = ?',
      [userId]
    );
    const user = users[0];

    // Get order details for email
    const orders = await query(
      'SELECT order_id, order_date, total_amount, credit_card_number FROM CUSTOMER_ORDERS WHERE order_id = ?',
      [orderId]
    );
    const order = { ...orders[0], items: orderItems.map(item => ({ ...item, book_isbn: item.isbn, price_at_purchase: item.price })) };

    // Send confirmation email (async, don't wait)
    sendOrderConfirmation(order, user).catch(err => console.error('Email error:', err));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId,
        message: 'Your order has been confirmed. A confirmation email has been sent.'
      }
    });
  } catch (error) {
    next(error);
  }
};

const viewPastOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const orders = await query(
      `SELECT order_id, order_date, total_amount, credit_card_number, credit_card_expiry
       FROM CUSTOMER_ORDERS
       WHERE user_id = ?
       ORDER BY order_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

const viewOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const orders = await query(
      'SELECT order_id, order_date, total_amount, credit_card_number, credit_card_expiry FROM CUSTOMER_ORDERS WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    const items = await query(
      `SELECT oi.order_item_id, oi.book_isbn, b.title, oi.quantity,
              oi.price_at_purchase, (oi.quantity * oi.price_at_purchase) AS subtotal
       FROM ORDER_ITEMS oi
       JOIN BOOKS b ON oi.book_isbn = b.isbn
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: orders[0],
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const orders = await query(
      `SELECT co.order_id, co.order_date, co.total_amount,
              u.username, u.email, u.first_name, u.last_name
       FROM CUSTOMER_ORDERS co
       JOIN USERS u ON co.user_id = u.user_id
       ORDER BY co.order_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) AS total FROM CUSTOMER_ORDERS'
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        orders,
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

const viewPublisherOrders = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';

    const orders = await query(
      `SELECT po.order_id, po.book_isbn, b.title, p.publisher_name,
              po.order_quantity, po.order_date, po.status,
              po.confirmed_date, 
              u1.username AS confirmed_by,
              u2.username AS created_by,
              CASE WHEN po.created_by IS NULL THEN 'Auto-generated' ELSE 'Manual' END AS order_type
       FROM PUBLISHER_ORDERS po
       JOIN BOOKS b ON po.book_isbn = b.isbn
       JOIN PUBLISHERS p ON po.publisher_id = p.publisher_id
       LEFT JOIN USERS u1 ON po.confirmed_by = u1.user_id
       LEFT JOIN USERS u2 ON po.created_by = u2.user_id
       WHERE po.status = ?
       ORDER BY po.order_date DESC`,
      [status]
    );

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

const confirmPublisherOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const adminUserId = req.user.userId;

    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin privileges required'
      });
    }

    const orders = await query(
      'SELECT status FROM PUBLISHER_ORDERS WHERE order_id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (orders[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    await query(
      `UPDATE PUBLISHER_ORDERS
       SET status = 'confirmed',
           confirmed_date = NOW(),
           confirmed_by = ?
       WHERE order_id = ?`,
      [adminUserId, orderId]
    );

    res.json({
      success: true,
      message: 'Publisher order confirmed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const placePublisherOrder = async (req, res, next) => {
  try {
    const { book_isbn, order_quantity } = req.body;
    const adminUserId = req.user.userId;

    const books = await query(
      'SELECT publisher_id FROM BOOKS WHERE isbn = ?',
      [book_isbn]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await query(
      `INSERT INTO PUBLISHER_ORDERS 
       (book_isbn, publisher_id, order_quantity, status, created_by)
       VALUES (?, ?, ?, 'pending', ?)`,
      [book_isbn, books[0].publisher_id, order_quantity, adminUserId]
    );

    res.status(201).json({
      success: true,
      message: 'Publisher order placed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Download invoice PDF
const downloadInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Get order details
    const orders = await query(
      'SELECT order_id, order_date, total_amount, credit_card_number, credit_card_expiry FROM CUSTOMER_ORDERS WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    // Get order items
    const items = await query(
      `SELECT oi.book_isbn, b.title, oi.quantity, oi.price_at_purchase
       FROM ORDER_ITEMS oi
       JOIN BOOKS b ON oi.book_isbn = b.isbn
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get user info
    const users = await query(
      'SELECT username, email, first_name, last_name, address FROM USERS WHERE user_id = ?',
      [userId]
    );

    const order = { ...orders[0], items };
    const user = users[0];

    // Generate PDF
    const pdfBuffer = await generateInvoice(order, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  viewPastOrders,
  viewOrderDetails,
  getAllOrders,
  viewPublisherOrders,
  confirmPublisherOrder,
  placePublisherOrder,
  downloadInvoice
};
