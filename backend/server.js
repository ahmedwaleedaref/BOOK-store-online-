const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: true, // Allow all origins for simplicity
    credentials: true
  })
);
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bookstore API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);  // Direct orders, no cart
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bookstore Order Processing System API - Simplified Version',
    version: '2.0.0',
    features: {
      authentication: 'JWT-based',
      orders: 'Direct order placement (no cart)',
      triggers: 'Auto-reorder, stock validation',
      database: '8 tables, 5 triggers'
    },
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      orders: '/api/orders (direct placement)',
      reports: '/api/reports (admin only)',
      admin: '/api/admin (admin only)'
    },
    notes: [
      'No shopping cart - customers place orders directly',
      'No payment information storage',
      'Simplified order flow'
    ]
  });
});

// Error handling
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📚 BOOKSTORE - SIMPLIFIED ORDER SYSTEM                   ║
║                                                            ║
║   Server is running on port ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║   API Base URL: http://localhost:${PORT}                      ║
║   Health Check: http://localhost:${PORT}/health               ║
║                                                            ║
║   Database: ${process.env.DB_NAME || 'BookstoreDB'}                                   ║
║                                                            ║
║   ✅ Direct Order Placement (No Cart)                      ║
║   ✅ Auto-Reorder Triggers                                 ║
║   ✅ Stock Management                                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
