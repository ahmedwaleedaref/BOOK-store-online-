/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Books
 *     description: Book management and search
 *   - name: Orders
 *     description: Order placement and history
 *   - name: Wishlist
 *     description: User wishlist management
 *   - name: Reviews
 *     description: Book reviews and ratings
 *   - name: Password Reset
 *     description: Password recovery
 *   - name: Reports
 *     description: Admin reports and analytics
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - first_name
 *               - last_name
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: Password123!
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to existing account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     tags: [Books]
 *     summary: Get all books with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of books
 */

/**
 * @swagger
 * /api/books/full-search:
 *   get:
 *     tags: [Books]
 *     summary: Full-text search across all book fields
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price, title, year]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Search results with pagination
 */

/**
 * @swagger
 * /api/books/{isbn}:
 *   get:
 *     tags: [Books]
 *     summary: Get book details by ISBN
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */

/**
 * @swagger
 * /api/orders/place-order:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - credit_card_number
 *               - credit_card_expiry
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     isbn:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               credit_card_number:
 *                 type: string
 *               credit_card_expiry:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed successfully
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get user's wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlist items
 *   post:
 *     tags: [Wishlist]
 *     summary: Add book to wishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isbn:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book added to wishlist
 */

/**
 * @swagger
 * /api/wishlist/{isbn}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove book from wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book removed from wishlist
 */

/**
 * @swagger
 * /api/reviews/book/{isbn}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a book
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews with stats
 *   post:
 *     tags: [Reviews]
 *     summary: Create or update a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review_title:
 *                 type: string
 *               review_text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */

/**
 * @swagger
 * /api/reviews/recommendations:
 *   get:
 *     tags: [Reviews]
 *     summary: Get personalized book recommendations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended books
 */

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     tags: [Password Reset]
 *     summary: Request password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 */

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     tags: [Password Reset]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - new_password
 *             properties:
 *               token:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */

/**
 * @swagger
 * /api/orders/{orderId}/invoice:
 *   get:
 *     tags: [Orders]
 *     summary: Download PDF invoice for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF invoice file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
