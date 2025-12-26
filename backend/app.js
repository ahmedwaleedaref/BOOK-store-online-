const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bookstore API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

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

app.use(notFound);
app.use(errorHandler);

module.exports = app;
