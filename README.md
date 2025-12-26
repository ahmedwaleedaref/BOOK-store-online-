# Bookstore Online

Full-stack bookstore application with a **React (Vite) + Tailwind** frontend and a **Node.js (Express) + MySQL** backend.

This project supports a **shopping cart + checkout** flow for customers. The database includes triggers for stock validation, stock deduction, and auto-reorder behavior.

## Features

### Customer
- Browse books, filter by category, view book details
- Manage shopping cart:
	- Add books to cart
	- View cart items
	- View individual and total prices
	- Remove items / update quantities
- Checkout cart:
	- Provide credit card number + expiry date (validated)
	- Stock is deducted after purchase (via DB triggers)
- Edit personal information (profile) and change password
- View order history and order details

### Admin
- Dashboard stats (books/customers/orders/revenue)
- Manage publishers and authors (CRUD)
- Manage books (create, update price/stock)
- View customer orders
- View/confirm publisher orders and create manual publisher orders
- Reports: previous-month sales, sales by date, top customers, top books, inventory status, reorder counts

### Database / Triggers
The database schema (see [backend/bookstore.sql](backend/bookstore.sql)) includes triggers such as:
- Prevent negative stock on updates
- Auto-create publisher orders when stock drops below threshold
- Validate stock before inserting order items
- Deduct stock after a sale
- Increase stock when a publisher order is confirmed

**Payment storage note:** the backend validates the credit card input during checkout and stores only a **masked** card number (e.g. `**** **** **** 4242`) and an expiry string on the order record. It does **not** store full card numbers.

## Tech Stack
- **Backend:** Node.js, Express, mysql2, JWT auth
- **Frontend:** React, Vite, Tailwind, React Query, Axios
- **Infra:** Docker Compose (MySQL + backend + frontend + phpMyAdmin)

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
- `import.meta.env.VITE_API_URL` (if set)
- otherwise defaults to `http://localhost:3000/api`

## Demo Accounts

The SQL seed data includes demo users:
- Admin: `admin` / `Admin123!`
- Customer: `john_doe` / `Customer123!`

## API Overview (Backend)

Base URL: `http://localhost:3000/api`

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `GET /profile` (auth)
- `PUT /profile` (auth)
- `PUT /change-password` (auth)
- `POST /logout` (auth)

### Books (`/api/books`)
- `GET /` (pagination: `page`, `limit`)
- `GET /categories`
- `GET /category/:category`
- `GET /search?type=...&value=...`
- `GET /:isbn`
- `POST /` (admin)
- `PUT /:isbn` (admin)

### Orders (`/api/orders`)
- `POST /place-order` (customer)
	- body: `items: [{ isbn, quantity }]`, `credit_card_number`, `credit_card_expiry`
- `GET /my-orders` (customer)
- `GET /my-orders/:orderId` (customer)
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

## Project Structure

```text
backend/   Express API + MySQL integration
frontend/  React UI (Vite + Tailwind)
docker/    Dockerfiles used by docker-compose
```

## UI Routes (Frontend)

### Customer
- `/cart` Shopping cart
- `/place-order` Checkout
- `/profile` Edit profile + change password

### Admin
- Admin users are redirected away from the Browse Books pages (`/books`, `/books/:isbn`) to the admin dashboard.


### Reset containers & volumes
```bash
docker compose down -v
docker compose up -d --build
```
