# Bookstore Online

[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/BOOK-store-online-/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/BOOK-store-online-/actions/workflows/ci.yml)

Full-stack e-commerce bookstore application with a **React (Vite) + Tailwind** frontend and a **Node.js (Express) + MySQL** backend.

This project features a complete shopping experience with cart, checkout, wishlists, reviews, recommendations, and PDF invoices. The database includes triggers for stock validation, stock deduction, and auto-reorder behavior.

## ✨ Key Features

### 🔍 Smart Search
- **Full-text search** across title, author, publisher, ISBN, and category
- **Advanced filters**: category, price range, availability
- **Sorting**: by relevance, price, title, or publication year

### 💜 Customer Experience
- **Wishlist**: Save books for later purchase
- **Reviews & Ratings**: 5-star rating system with detailed reviews
- **Personalized Recommendations**: "Customers who bought this also bought..."
- **PDF Invoices**: Download professional invoices for orders
- **Email Notifications**: Order confirmation emails with attached invoices
- **Password Reset**: Secure password recovery via email

### 🛒 E-Commerce
- Shopping cart with quantity management
- Secure checkout with credit card validation
- Order history with detailed item breakdown
- Real-time stock validation via database triggers

### 👨‍💼 Admin Dashboard
- Sales analytics and reports
- Inventory management with auto-reorder alerts
- Publisher order management
- Customer and order insights

### 🔧 Technical Highlights
- **API Documentation**: Interactive Swagger UI at `/api-docs`
- **Unit Tests**: Jest test suite with coverage reporting
- **CI/CD Pipeline**: GitHub Actions for automated testing and builds
- **Docker Support**: One-command deployment with Docker Compose
- **Database Triggers**: 5 MySQL triggers for business logic

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Query, Axios |
| **Backend** | Node.js, Express, MySQL, JWT, Nodemailer, PDFKit |
| **Database** | MySQL 8 with triggers and stored procedures |
| **DevOps** | Docker Compose, GitHub Actions CI/CD |
| **Testing** | Jest, Supertest |
| **Docs** | Swagger/OpenAPI |

## Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop

### Run
1) From the repo root:

```bash
docker compose up -d --build
```

2) Open:
- Frontend: `http://localhost:80`
- Backend health: `http://localhost:3000/health`
- phpMyAdmin: `http://localhost:8081`

### Default ports
Configured in `.env`:
- `FRONTEND_PORT=80`
- `BACKEND_PORT=3000`
- `DB_PORT=3306`
- `PHPMYADMIN_PORT=8081`

## Local Development (without Docker)

### 1) Database
You need a MySQL server running locally and a database created.

Import the schema + sample data:
- Use [backend/bookstore.sql](backend/bookstore.sql)

### 2) Backend
```bash
cd backend
npm install
npm run dev
```



The backend runs on `http://localhost:3000` by default.

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```


The frontend uses `VITE_API_URL` to connect to the backend.

## Environment Variables

### Root `.env`
Docker Compose reads `.env` from the repo root.

Important variables:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (keep it private)
- `VITE_API_URL` (frontend API base URL)

### Frontend API URL
Frontend Axios base URL is:
- otherwise defaults to `http://localhost:3000/api`

## Demo Accounts

The SQL seed data includes demo users:
- Admin: `admin` / `Admin123!`
- Customer: `john_doe` / `Customer123!`

## API Overview (Backend)

Base URL: `http://localhost:3000/api`

📖 **Interactive API Docs**: `http://localhost:3000/api-docs`

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `GET /profile` (auth)
- `PUT /profile` (auth)
- `PUT /change-password` (auth)
- `POST /logout` (auth)

### Password Reset (`/api/password-reset`)
- `POST /request` - Request password reset email
- `GET /verify/:token` - Verify reset token
- `POST /reset` - Reset password with token

### Books (`/api/books`)
- `GET /` (pagination: `page`, `limit`)
- `GET /categories`
- `GET /full-search?q=...` (full-text search with filters: `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `order`, `page`, `limit`)
- `GET /category/:category`
- `GET /search?type=...&value=...`
- `GET /:isbn`
- `POST /` (admin)
- `PUT /:isbn` (admin)

### Wishlist (`/api/wishlist`) (auth)
- `GET /` - Get user's wishlist
- `POST /` - Add book to wishlist
- `GET /:isbn` - Check if book is in wishlist
- `DELETE /:isbn` - Remove from wishlist

### Reviews (`/api/reviews`)
- `GET /book/:isbn` - Get reviews for a book
- `GET /book/:isbn/my-review` (auth) - Get user's review
- `POST /book/:isbn` (auth) - Create/update review
- `DELETE /book/:isbn` (auth) - Delete review
- `GET /recommendations` (auth) - Get personalized recommendations

### Orders (`/api/orders`)
- `POST /place-order` (customer) - Place order with email confirmation
	- body: `items: [{ isbn, quantity }]`, `credit_card_number`, `credit_card_expiry`
- `GET /my-orders` (customer)
- `GET /my-orders/:orderId` (customer)
- `GET /my-orders/:orderId/invoice` (customer) - Download PDF invoice
- `GET /` (admin, paginated)
- `GET /publisher-orders?status=pending|confirmed` (admin)
- `POST /publisher-orders` (admin)
- `PUT /publisher-orders/:orderId/confirm` (admin)

### Reports (`/api/reports`) (admin)
- `GET /dashboard`
- `GET /sales/previous-month`
- `GET /sales/by-date?date=YYYY-MM-DD`
- `GET /sales/daily`
- `GET /customers/top`
- `GET /books/top`
- `GET /books/:isbn/reorders`
- `GET /inventory/status`

## Testing

```bash
cd backend
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## Project Structure

```text
backend/
├── controllers/     # Route handlers
├── routes/          # API routes
├── middleware/      # Auth, validation
├── services/        # Email, PDF generation
├── tests/           # Jest test suites
├── swagger/         # API documentation
└── bookstore.sql    # Database schema

frontend/
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Route pages
│   ├── context/     # React Context providers
│   └── services/    # API client

.github/workflows/   # CI/CD pipeline
docker/              # Dockerfiles
```

## UI Routes (Frontend)

### Customer
- `/books` - Browse and search books
- `/books/:isbn` - Book details with reviews
- `/cart` - Shopping cart
- `/wishlist` - Saved books
- `/my-orders` - Order history
- `/my-orders/:orderId` - Order details with invoice download
- `/profile` - Edit profile + change password
- `/forgot-password` - Password recovery
- `/reset-password` - Reset password form

### Admin
- `/admin` - Dashboard
- `/admin/books` - Manage books
- `/admin/orders` - View orders
- `/admin/publisher-orders` - Publisher orders
- `/admin/publishers` - Manage publishers
- `/admin/authors` - Manage authors
- `/admin/reports` - Analytics


### Reset containers & volumes
```bash
docker compose down -v
docker compose up -d --build
```
