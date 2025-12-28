const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bookstore API',
      version: '2.0.0',
      description: 'Full-stack bookstore API with authentication, orders, reviews, wishlists, and more',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './swagger/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bookstore API Docs'
}));

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
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bookstore Order Processing System API',
    version: '2.0.0',
    features: {
      authentication: 'JWT-based',
      orders: 'Direct order placement with email confirmation',
      triggers: 'Auto-reorder, stock validation',
      database: '11 tables, 5 triggers',
      search: 'Full-text search with filters',
      reviews: 'Customer reviews and ratings',
      wishlist: 'Save books for later',
      recommendations: 'Personalized book suggestions',
      invoices: 'PDF invoice generation'
    },
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      orders: '/api/orders',
      reports: '/api/reports (admin)',
      admin: '/api/admin (admin)',
      wishlist: '/api/wishlist',
      reviews: '/api/reviews',
      passwordReset: '/api/password-reset'
    },
    documentation: '/api-docs'
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
