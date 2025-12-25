const { query } = require('../config/database');

// Get sales report for previous month
const getPreviousMonthSales = async (req, res, next) => {
  try {
    const results = await query(
      `SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total_amount) AS total_sales,
        COUNT(*) AS num_orders,
        COUNT(DISTINCT user_id) AS num_customers
       FROM CUSTOMER_ORDERS
       WHERE order_date >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), '%Y-%m-01')
         AND order_date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
       GROUP BY DATE_FORMAT(order_date, '%Y-%m')`
    );

    res.json({
      success: true,
      data: results[0] || {
        month: null,
        total_sales: 0,
        num_orders: 0,
        num_customers: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sales report for specific date
const getSalesByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }

    const results = await query(
      `SELECT 
        DATE(order_date) AS sale_date,
        SUM(total_amount) AS total_sales,
        COUNT(*) AS num_orders,
        COUNT(DISTINCT user_id) AS num_customers
       FROM CUSTOMER_ORDERS
       WHERE DATE(order_date) = ?
       GROUP BY DATE(order_date)`,
      [date]
    );

    res.json({
      success: true,
      data: results[0] || {
        sale_date: date,
        total_sales: 0,
        num_orders: 0,
        num_customers: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get top 5 customers (last 3 months)
const getTopCustomers = async (req, res, next) => {
  try {
    const results = await query(
      `SELECT 
        u.user_id,
        u.username,
        CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
        u.email,
        SUM(co.total_amount) AS total_spent,
        COUNT(co.order_id) AS num_orders
       FROM USERS u
       JOIN CUSTOMER_ORDERS co ON u.user_id = co.user_id
       WHERE co.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
       GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.email
       ORDER BY total_spent DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get top 10 selling books (last 3 months)
const getTopBooks = async (req, res, next) => {
  try {
    const results = await query(
      `SELECT 
        b.isbn,
        b.title,
        b.category,
        p.publisher_name,
        SUM(oi.quantity) AS total_copies_sold,
        SUM(oi.quantity * oi.price_at_purchase) AS total_revenue
       FROM BOOKS b
       JOIN ORDER_ITEMS oi ON b.isbn = oi.book_isbn
       JOIN CUSTOMER_ORDERS co ON oi.order_id = co.order_id
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       WHERE co.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
       GROUP BY b.isbn, b.title, b.category, p.publisher_name
       ORDER BY total_copies_sold DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get book reorder count
const getBookReorderCount = async (req, res, next) => {
  try {
    const { isbn } = req.params;

    const results = await query(
      `SELECT 
        b.isbn,
        b.title,
        b.category,
        p.publisher_name,
        COUNT(po.order_id) AS times_reordered,
        SUM(CASE WHEN po.status = 'confirmed' 
            THEN po.order_quantity ELSE 0 END) AS total_units_received,
        SUM(CASE WHEN po.status = 'pending' 
            THEN po.order_quantity ELSE 0 END) AS pending_units
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       LEFT JOIN PUBLISHER_ORDERS po ON b.isbn = po.book_isbn
       WHERE b.isbn = ?
       GROUP BY b.isbn, b.title, b.category, p.publisher_name`,
      [isbn]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get daily sales data (for charts)
const getDailySales = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let sql = `
      SELECT 
        DATE(order_date) AS sale_date,
        SUM(total_amount) AS total_sales,
        COUNT(*) AS num_orders
      FROM CUSTOMER_ORDERS
    `;
    
    const params = [];

    if (start_date && end_date) {
      sql += ' WHERE order_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      sql += ' WHERE order_date >= ?';
      params.push(start_date);
    }

    sql += ' GROUP BY DATE(order_date) ORDER BY sale_date DESC LIMIT 30';

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory status report
const getInventoryStatus = async (req, res, next) => {
  try {
    const results = await query(
      `SELECT 
        b.isbn, b.title, b.category, b.quantity_in_stock, b.threshold_quantity,
        p.publisher_name,
        CASE 
          WHEN b.quantity_in_stock = 0 THEN 'OUT_OF_STOCK'
          WHEN b.quantity_in_stock < b.threshold_quantity THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END AS stock_status
       FROM BOOKS b
       JOIN PUBLISHERS p ON b.publisher_id = p.publisher_id
       WHERE b.quantity_in_stock < b.threshold_quantity
       ORDER BY b.quantity_in_stock ASC`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    // Get all stats in parallel
    const [
      booksCount,
      customersCount,
      ordersCount,
      revenue,
      recentOrders,
      lowStock,
      pendingOrders
    ] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM BOOKS'),
      query("SELECT COUNT(*) AS count FROM USERS WHERE user_type = 'customer'"),
      query('SELECT COUNT(*) AS count FROM CUSTOMER_ORDERS'),
      query('SELECT COALESCE(SUM(total_amount), 0) AS total FROM CUSTOMER_ORDERS'),
      query(`
        SELECT co.order_id, co.order_date, co.total_amount, u.username
        FROM CUSTOMER_ORDERS co
        JOIN USERS u ON co.user_id = u.user_id
        ORDER BY co.order_date DESC
        LIMIT 5
      `),
      query(`
        SELECT COUNT(*) AS count 
        FROM BOOKS 
        WHERE quantity_in_stock < threshold_quantity
      `),
      query(`
        SELECT COUNT(*) AS count 
        FROM PUBLISHER_ORDERS 
        WHERE status = 'pending'
      `)
    ]);

    res.json({
      success: true,
      data: {
        totalBooks: booksCount[0].count,
        totalCustomers: customersCount[0].count,
        totalOrders: ordersCount[0].count,
        totalRevenue: revenue[0].total,
        lowStockBooks: lowStock[0].count,
        pendingPublisherOrders: pendingOrders[0].count,
        recentOrders: recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreviousMonthSales,
  getSalesByDate,
  getTopCustomers,
  getTopBooks,
  getBookReorderCount,
  getDailySales,
  getInventoryStatus,
  getDashboardStats
};
