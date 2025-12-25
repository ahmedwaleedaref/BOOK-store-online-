


-- 1. PUBLISHERS Table
CREATE TABLE PUBLISHERS (
    publisher_id INT PRIMARY KEY AUTO_INCREMENT,
    publisher_name VARCHAR(100) UNIQUE NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(20)
);

-- 2. AUTHORS Table
CREATE TABLE AUTHORS (
    author_id INT PRIMARY KEY AUTO_INCREMENT,
    author_name VARCHAR(100) NOT NULL
);

-- 3. USERS Table (Admin and Customer)
CREATE TABLE USERS (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    address VARCHAR(255),
    user_type ENUM('admin', 'customer') NOT NULL
);

-- 4. BOOKS Table
CREATE TABLE BOOKS (
    isbn VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publisher_id INT NOT NULL,
    publication_year INT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    category ENUM('Science', 'Art', 'Religion', 'History', 'Geography') NOT NULL,
    quantity_in_stock INT DEFAULT 0 CHECK (quantity_in_stock >= 0),
    threshold_quantity INT NOT NULL CHECK (threshold_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES PUBLISHERS(publisher_id)
);

-- 5. BOOK_AUTHORS Junction Table
CREATE TABLE BOOK_AUTHORS (
    book_isbn VARCHAR(20),
    author_id INT,
    PRIMARY KEY (book_isbn, author_id),
    FOREIGN KEY (book_isbn) REFERENCES BOOKS(isbn) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES AUTHORS(author_id) ON DELETE CASCADE
);

-- 6. PUBLISHER_ORDERS Table (Replenishment Orders)
CREATE TABLE PUBLISHER_ORDERS (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    book_isbn VARCHAR(20) NOT NULL,
    publisher_id INT NOT NULL,
    order_quantity INT NOT NULL CHECK (order_quantity > 0),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed') DEFAULT 'pending',
    confirmed_date TIMESTAMP NULL,
    confirmed_by INT NULL,
    created_by INT NULL,
    FOREIGN KEY (book_isbn) REFERENCES BOOKS(isbn),
    FOREIGN KEY (publisher_id) REFERENCES PUBLISHERS(publisher_id),
    FOREIGN KEY (confirmed_by) REFERENCES USERS(user_id),
    FOREIGN KEY (created_by) REFERENCES USERS(user_id)
);

-- 7. CUSTOMER_ORDERS Table 
CREATE TABLE CUSTOMER_ORDERS (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- 8. ORDER_ITEMS Table
CREATE TABLE ORDER_ITEMS (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    book_isbn VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES CUSTOMER_ORDERS(order_id) ON DELETE CASCADE,
    FOREIGN KEY (book_isbn) REFERENCES BOOKS(isbn)
);


-- Trigger 1: Prevent Negative Stock (BEFORE UPDATE on BOOKS)
DELIMITER //
CREATE TRIGGER trg_prevent_negative_stock
BEFORE UPDATE ON BOOKS
FOR EACH ROW
BEGIN
    IF NEW.quantity_in_stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Book quantity cannot be negative';
    END IF;
END//
DELIMITER ;

-- Trigger 2: Auto-Reorder Books When Stock Drops Below Threshold (AFTER UPDATE on BOOKS)
DELIMITER //
CREATE TRIGGER trg_auto_reorder_books
AFTER UPDATE ON BOOKS
FOR EACH ROW
BEGIN
    -- Check if stock dropped from above threshold to below threshold
    IF OLD.quantity_in_stock >= OLD.threshold_quantity 
       AND NEW.quantity_in_stock < NEW.threshold_quantity THEN
        
        -- Create automatic replenishment order
        -- Note: created_by is NULL for auto-generated orders
        INSERT INTO PUBLISHER_ORDERS (
            book_isbn, 
            publisher_id, 
            order_quantity, 
            status,
            created_by
        )
        VALUES (
            NEW.isbn,
            NEW.publisher_id,
            50,  -- Fixed reorder quantity
            'pending',
            NULL  -- Auto-generated, no user
        );
    END IF;
END//
DELIMITER ;

-- Trigger 3: Update Stock When Publisher Order is Confirmed (AFTER UPDATE on PUBLISHER_ORDERS)
DELIMITER //
CREATE TRIGGER trg_update_stock_on_confirmation
AFTER UPDATE ON PUBLISHER_ORDERS
FOR EACH ROW
BEGIN
    -- When order status changes to 'confirmed', add quantity to book stock
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE BOOKS
        SET quantity_in_stock = quantity_in_stock + NEW.order_quantity
        WHERE isbn = NEW.book_isbn;
    END IF;
END//
DELIMITER ;

-- Trigger 4: Validate Sufficient Stock Before Adding to Order (BEFORE INSERT on ORDER_ITEMS)
DELIMITER //
CREATE TRIGGER trg_validate_order_stock
BEFORE INSERT ON ORDER_ITEMS
FOR EACH ROW
BEGIN
    DECLARE available_stock INT;
    
    SELECT quantity_in_stock INTO available_stock
    FROM BOOKS
    WHERE isbn = NEW.book_isbn;
    
    IF available_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Insufficient stock available for this book';
    END IF;
END//
DELIMITER ;

-- Trigger 5: Deduct Stock After Customer Purchase (AFTER INSERT on ORDER_ITEMS)
DELIMITER //
CREATE TRIGGER trg_deduct_stock_after_sale
AFTER INSERT ON ORDER_ITEMS
FOR EACH ROW
BEGIN
    UPDATE BOOKS
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE isbn = NEW.book_isbn;
END//
DELIMITER ;

-- ============================================================================
-- SECTION 3: SAMPLE DATA
-- ============================================================================

-- Insert Admin User (password: Admin123!)
INSERT INTO USERS (username, password_hash, email, first_name, last_name, phone_number, address, user_type)
VALUES ('admin', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
        'admin@bookstore.com', 'System', 'Administrator', '555-0100', 'Admin Office', 'admin');

-- Insert Publishers
INSERT INTO PUBLISHERS (publisher_name, address, phone_number) VALUES
('Penguin Random House', '1745 Broadway, New York, NY 10019', '212-782-9000'),
('HarperCollins', '195 Broadway, New York, NY 10007', '212-207-7000'),
('Simon & Schuster', '1230 Avenue of the Americas, New York, NY 10020', '212-698-7000'),
('Macmillan Publishers', '120 Broadway, New York, NY 10271', '646-307-5151'),
('Hachette Book Group', '1290 Avenue of the Americas, New York, NY 10104', '212-364-1100');

-- Insert Authors
INSERT INTO AUTHORS (author_name) VALUES
('Stephen Hawking'),
('Yuval Noah Harari'),
('Malcolm Gladwell'),
('Michelle Obama'),
('Tara Westover'),
('Viktor Frankl'),
('Carl Sagan'),
('Howard Zinn'),
('Karen Armstrong'),
('Jared Diamond');

-- Insert Books
INSERT INTO BOOKS (isbn, title, publisher_id, publication_year, price, category, quantity_in_stock, threshold_quantity) VALUES
('9780553380163', 'A Brief History of Time', 1, 1988, 18.99, 'Science', 50, 10),
('9780062316110', 'Sapiens: A Brief History of Humankind', 2, 2011, 24.99, 'History', 75, 15),
('9780316346627', 'Outliers: The Story of Success', 3, 2008, 17.99, 'Science', 60, 12),
('9781524763138', 'Becoming', 1, 2018, 32.50, 'History', 100, 20),
('9780399590504', 'Educated: A Memoir', 1, 2018, 28.00, 'History', 80, 15),
('9780807067048', 'Mans Search for Meaning', 1, 1946, 14.99, 'Religion', 45, 10),
('9780345539434', 'Cosmos', 1, 1980, 22.00, 'Science', 55, 12),
('9780062694690', 'A Peoples History of the United States', 2, 1980, 19.99, 'History', 40, 10),
('9780345384560', 'A History of God', 1, 1993, 21.50, 'Religion', 35, 8),
('9780393354324', 'Guns, Germs, and Steel', 3, 1997, 26.99, 'Geography', 48, 10),
('9780141439518', 'The Origin of Species', 1, 1859, 15.99, 'Science', 30, 8),
('9780452284234', 'The Alchemist', 2, 1988, 14.99, 'Art', 65, 15),
('9780316769488', 'The Catcher in the Rye', 3, 1951, 13.99, 'Art', 55, 12),
('9780525478812', 'Educated', 1, 2018, 27.00, 'History', 70, 15),
('9780679783268', 'Pride and Prejudice', 4, 1813, 12.99, 'Art', 40, 10);

-- Link Books to Authors
INSERT INTO BOOK_AUTHORS (book_isbn, author_id) VALUES
('9780553380163', 1),
('9780062316110', 2),
('9780316346627', 3),
('9781524763138', 4),
('9780399590504', 5),
('9780807067048', 6),
('9780345539434', 7),
('9780062694690', 8),
('9780345384560', 9),
('9780393354324', 10),
('9780141439518', 1),  -- Stephen Hawking also wrote Origin of Species context
('9780452284234', 2),  -- Multiple authors possible
('9780316769488', 3),
('9780525478812', 5),
('9780679783268', 4);

-- Insert Sample Customers (password: Customer123!)
INSERT INTO USERS (username, password_hash, email, first_name, last_name, phone_number, address, user_type)
VALUES 
('john_doe', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
 'john.doe@email.com', 'John', 'Doe', '555-0101', '123 Main St, New York, NY 10001', 'customer'),
('jane_smith', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
 'jane.smith@email.com', 'Jane', 'Smith', '555-0102', '456 Oak Ave, Los Angeles, CA 90001', 'customer'),
('bob_wilson', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
 'bob.wilson@email.com', 'Bob', 'Wilson', '555-0103', '789 Pine Rd, Chicago, IL 60601', 'customer'),
('alice_johnson', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
 'alice.johnson@email.com', 'Alice', 'Johnson', '555-0104', '321 Elm St, Houston, TX 77001', 'customer'),
('charlie_brown', '$2a$10$BfG49XzSs6h5AX5X8QX2QeLbpg0lIJtjuFcfXUvsS7loWJfUt6JD2', 
 'charlie.brown@email.com', 'Charlie', 'Brown', '555-0105', '654 Maple Dr, Phoenix, AZ 85001', 'customer');

-- Insert Sample Customer Orders (Direct Orders - No Cart)
INSERT INTO CUSTOMER_ORDERS (user_id, order_date, total_amount)
VALUES 
(2, DATE_SUB(NOW(), INTERVAL 60 DAY), 68.97),  -- john_doe
(3, DATE_SUB(NOW(), INTERVAL 45 DAY), 89.97),  -- jane_smith
(4, DATE_SUB(NOW(), INTERVAL 30 DAY), 45.98),  -- bob_wilson
(2, DATE_SUB(NOW(), INTERVAL 15 DAY), 132.48), -- john_doe (2nd order)
(5, DATE_SUB(NOW(), INTERVAL 7 DAY), 54.98);   -- charlie_brown

-- Insert Order Items
INSERT INTO ORDER_ITEMS (order_id, book_isbn, quantity, price_at_purchase)
VALUES 
-- Order 1 (john_doe, 60 days ago)
(1, '9780062316110', 2, 24.99),  -- Sapiens x2
(1, '9780553380163', 1, 18.99),  -- Brief History x1

-- Order 2 (jane_smith, 45 days ago)
(2, '9781524763138', 2, 32.50),  -- Becoming x2
(2, '9780316346627', 1, 24.99),  -- Outliers x1 (diff price)

-- Order 3 (bob_wilson, 30 days ago)
(3, '9780807067048', 2, 14.99),  -- Man's Search x2
(3, '9780452284234', 1, 15.99),  -- Alchemist x1

-- Order 4 (john_doe, 15 days ago - larger order)
(4, '9780345539434', 3, 22.00),  -- Cosmos x3
(4, '9780393354324', 2, 26.99),  -- Guns, Germs x2
(4, '9780525478812', 1, 27.00),  -- Educated x1

-- Order 5 (charlie_brown, 7 days ago)
(5, '9780316769488', 2, 13.99),  -- Catcher x2
(5, '9780679783268', 2, 13.50);  -- Pride x2 (sale price)

-- Insert Sample Publisher Orders
-- Manual order by admin
INSERT INTO PUBLISHER_ORDERS (book_isbn, publisher_id, order_quantity, status, created_by, confirmed_by, confirmed_date)
VALUES 
('9780553380163', 1, 100, 'confirmed', 1, 1, DATE_SUB(NOW(), INTERVAL 20 DAY));

-- Pending manual order
INSERT INTO PUBLISHER_ORDERS (book_isbn, publisher_id, order_quantity, status, created_by)
VALUES 
('9780062316110', 2, 75, 'pending', 1);

-- Auto-generated order (created_by is NULL)
-- This would be created by trigger when stock drops below threshold
INSERT INTO PUBLISHER_ORDERS (book_isbn, publisher_id, order_quantity, status, created_by)
VALUES 
('9780345539434', 1, 50, 'pending', NULL);

