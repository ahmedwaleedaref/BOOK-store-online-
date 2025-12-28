


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
    credit_card_number VARCHAR(25) NOT NULL,
    credit_card_expiry VARCHAR(7) NOT NULL,
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

-- SECTION 3: SAMPLE DATA

-- Insert Admin User (password: Admin123!)
INSERT INTO USERS (username, password_hash, email, first_name, last_name, phone_number, address, user_type)
VALUES ('admin','$2a$10$L9QDrd4HTKH89rMofjn8LODAXRx14u6YYCqysSOIpZQNVs9o02EAC','admin@bookstore.com', 'System', 'Administrator', '555-0100', 'Admin Office', 'admin');

-- Insert Publishers
INSERT INTO PUBLISHERS (publisher_name, address, phone_number) VALUES
('Penguin Random House', '1745 Broadway, New York, NY 10019', '212-782-9000'),
('HarperCollins', '195 Broadway, New York, NY 10007', '212-207-7000'),
('Simon & Schuster', '1230 Avenue of the Americas, New York, NY 10020', '212-698-7000'),
('Macmillan Publishers', '120 Broadway, New York, NY 10271', '646-307-5151'),
('Hachette Book Group', '1290 Avenue of the Americas, New York, NY 10104', '212-364-1100'),
('Scholastic', '557 Broadway, New York, NY 10012', '212-343-6100'),
('Bloomsbury Publishing', '1385 Broadway, New York, NY 10018', '212-419-5300'),
('Oxford University Press', '198 Madison Avenue, New York, NY 10016', '212-726-6000'),
('Cambridge University Press', '1 Liberty Plaza, New York, NY 10006', '212-337-5000'),
('Wiley', '111 River Street, Hoboken, NJ 07030', '201-748-6000');

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
('Jared Diamond'),
('J.K. Rowling'),
('George Orwell'),
('Harper Lee'),
('F. Scott Fitzgerald'),
('Jane Austen'),
('Mark Twain'),
('Ernest Hemingway'),
('Charles Dickens'),
('Leo Tolstoy'),
('Fyodor Dostoevsky'),
('Gabriel Garcia Marquez'),
('Paulo Coelho'),
('Dan Brown'),
('Agatha Christie'),
('Stephen King'),
('J.R.R. Tolkien'),
('C.S. Lewis'),
('Isaac Asimov'),
('Arthur Conan Doyle'),
('Oscar Wilde'),
('Virginia Woolf'),
('James Joyce'),
('Franz Kafka'),
('Albert Camus'),
('Jean-Paul Sartre'),
('Umberto Eco'),
('Haruki Murakami'),
('Khaled Hosseini'),
('Chimamanda Ngozi Adichie'),
('Neil Gaiman'),
('Margaret Atwood'),
('Cormac McCarthy'),
('Donna Tartt'),
('Colleen Hoover'),
('James Clear'),
('Cal Newport'),
('Robert Greene'),
('Ryan Holiday'),
('Brene Brown'),
('Adam Grant');

-- Insert Books (Real bestsellers and classics with actual ISBNs)
INSERT INTO BOOKS (isbn, title, publisher_id, publication_year, price, category, quantity_in_stock, threshold_quantity) VALUES
-- Science
('9780553380163', 'A Brief History of Time', 1, 1988, 18.99, 'Science', 50, 10),
('9780345539434', 'Cosmos', 1, 1980, 22.00, 'Science', 55, 12),
('9780141439518', 'The Origin of Species', 1, 1859, 15.99, 'Science', 30, 8),
('9780307474278', 'The Elegant Universe', 2, 1999, 17.99, 'Science', 45, 10),
('9780393609394', 'Astrophysics for People in a Hurry', 3, 2017, 14.99, 'Science', 80, 15),
('9780143111368', 'The Gene: An Intimate History', 1, 2016, 20.00, 'Science', 35, 8),
('9780062316097', 'Sapiens: A Brief History of Humankind', 2, 2015, 24.99, 'Science', 95, 20),
('9780525559474', 'The Body: A Guide for Occupants', 1, 2019, 19.99, 'Science', 60, 12),
('9780374533557', 'Thinking, Fast and Slow', 4, 2011, 18.00, 'Science', 70, 15),
('9780143127741', 'Sapiens Graphic Novel', 2, 2020, 29.99, 'Science', 40, 10),

-- History
('9780062316110', 'Sapiens: A Brief History of Humankind', 2, 2011, 24.99, 'History', 75, 15),
('9781524763138', 'Becoming', 1, 2018, 32.50, 'History', 100, 20),
('9780399590504', 'Educated: A Memoir', 1, 2018, 28.00, 'History', 80, 15),
('9780062694690', 'A Peoples History of the United States', 2, 1980, 19.99, 'History', 40, 10),
('9780393354324', 'Guns, Germs, and Steel', 3, 1997, 26.99, 'History', 48, 10),
('9780143038580', 'Team of Rivals', 1, 2005, 22.00, 'History', 35, 8),
('9780060838676', 'The Rise and Fall of the Third Reich', 3, 1960, 25.99, 'History', 28, 6),
('9780679720201', '1776', 3, 2005, 18.00, 'History', 42, 10),
('9780307352156', 'Unbroken', 1, 2010, 18.00, 'History', 65, 12),
('9780307887436', 'The Warmth of Other Suns', 1, 2010, 18.99, 'History', 38, 8),
('9780735211292', 'Atomic Habits', 1, 2018, 27.00, 'History', 120, 25),
('9780525434290', 'The Splendid and the Vile', 1, 2020, 19.99, 'History', 55, 12),

-- Religion
('9780807067048', 'Mans Search for Meaning', 1, 1946, 14.99, 'Religion', 45, 10),
('9780345384560', 'A History of God', 1, 1993, 21.50, 'Religion', 35, 8),
('9780060652937', 'Mere Christianity', 2, 1952, 15.99, 'Religion', 50, 10),
('9780061120084', 'The Alchemist', 2, 1988, 16.99, 'Religion', 90, 18),
('9780062511409', 'The Monk Who Sold His Ferrari', 2, 1997, 17.00, 'Religion', 45, 10),
('9780062457714', 'The Seven Spiritual Laws of Success', 1, 1994, 14.00, 'Religion', 40, 8),
('9780553109535', 'The Art of Happiness', 1, 1998, 16.00, 'Religion', 55, 12),
('9780743223188', 'The Purpose Driven Life', 3, 2002, 17.99, 'Religion', 60, 12),
('9780062515872', 'The Untethered Soul', 2, 2007, 17.99, 'Religion', 48, 10),
('9780062236845', 'Daring Greatly', 1, 2012, 18.00, 'Religion', 52, 10),

-- Art (Literature/Fiction)
('9780452284234', 'The Alchemist', 2, 1988, 14.99, 'Art', 65, 15),
('9780316769488', 'The Catcher in the Rye', 3, 1951, 13.99, 'Art', 55, 12),
('9780679783268', 'Pride and Prejudice', 4, 1813, 12.99, 'Art', 40, 10),
('9780451524935', '1984', 1, 1949, 15.99, 'Art', 85, 18),
('9780061120084', 'To Kill a Mockingbird', 2, 1960, 16.99, 'Art', 95, 20),
('9780743273565', 'The Great Gatsby', 3, 1925, 15.00, 'Art', 70, 15),
('9780141439600', 'Great Expectations', 1, 1861, 12.99, 'Art', 35, 8),
('9780140449136', 'Crime and Punishment', 1, 1866, 16.00, 'Art', 42, 10),
('9780140449242', 'War and Peace', 1, 1869, 20.00, 'Art', 30, 6),
('9780060883287', 'One Hundred Years of Solitude', 2, 1967, 17.00, 'Art', 48, 10),
('9780439708180', 'Harry Potter and the Sorcerers Stone', 6, 1997, 12.99, 'Art', 150, 30),
('9780439064873', 'Harry Potter and the Chamber of Secrets', 6, 1998, 12.99, 'Art', 140, 28),
('9780439136365', 'Harry Potter and the Prisoner of Azkaban', 6, 1999, 12.99, 'Art', 135, 27),
('9780547928227', 'The Hobbit', 4, 1937, 15.99, 'Art', 80, 16),
('9780544003415', 'The Lord of the Rings', 4, 1954, 35.00, 'Art', 60, 12),
('9780007141326', 'The Lion, the Witch and the Wardrobe', 2, 1950, 12.99, 'Art', 55, 12),
('9780553293357', 'Foundation', 1, 1951, 17.00, 'Art', 45, 10),
('9780307474728', 'The Da Vinci Code', 1, 2003, 17.00, 'Art', 75, 15),
('9780062073488', 'Murder on the Orient Express', 2, 2011, 15.99, 'Art', 50, 10),
('9781501142970', 'It', 3, 1986, 19.99, 'Art', 55, 12),
('9780385333481', 'The Shining', 1, 1977, 17.00, 'Art', 48, 10),
('9780307744432', 'The Girl with the Dragon Tattoo', 1, 2005, 17.00, 'Art', 60, 12),
('9780143127550', 'The Handmaids Tale', 1, 1985, 16.00, 'Art', 65, 14),
('9780307387899', 'The Road', 1, 2006, 16.00, 'Art', 42, 10),
('9780316055437', 'The Secret History', 1, 1992, 18.00, 'Art', 38, 8),
('9781501110368', 'It Ends with Us', 3, 2016, 17.99, 'Art', 110, 22),
('9781668001226', 'It Starts with Us', 3, 2022, 18.99, 'Art', 95, 20),
('9780735222359', 'Where the Crawdads Sing', 1, 2018, 18.00, 'Art', 85, 18),
('9780593321201', 'Tomorrow and Tomorrow and Tomorrow', 1, 2022, 28.00, 'Art', 70, 15),
('9781501161933', 'The Seven Husbands of Evelyn Hugo', 3, 2017, 17.00, 'Art', 90, 18),

-- Geography
('9780393354324', 'Guns, Germs, and Steel', 3, 1997, 26.99, 'Geography', 48, 10),
('9780062316097', 'Homo Deus', 2, 2017, 24.99, 'Geography', 55, 12),
('9780374533557', 'Thinking, Fast and Slow', 4, 2011, 18.00, 'Geography', 60, 12),
('9780316346627', 'Outliers: The Story of Success', 3, 2008, 17.99, 'Geography', 65, 14),
('9780316017930', 'Outliers', 3, 2008, 18.99, 'Geography', 70, 15),
('9780062457714', 'The Power of Habit', 1, 2012, 18.00, 'Geography', 75, 15),
('9780525559474', 'Range: Why Generalists Triumph', 1, 2019, 17.99, 'Geography', 50, 10),
('9780593135204', 'Think Again', 1, 2021, 28.00, 'Geography', 65, 14),
('9780525429586', 'Deep Work', 1, 2016, 18.00, 'Geography', 55, 12),
('9780143126560', 'Quiet: The Power of Introverts', 1, 2012, 18.00, 'Geography', 58, 12);

-- Link Books to Authors
INSERT INTO BOOK_AUTHORS (book_isbn, author_id) VALUES
-- Science books
('9780553380163', 1),  -- A Brief History of Time - Stephen Hawking
('9780345539434', 7),  -- Cosmos - Carl Sagan
('9780141439518', 1),  -- Origin of Species - (using Hawking as placeholder)
('9780062316097', 2),  -- Sapiens - Yuval Noah Harari
('9780374533557', 3),  -- Thinking Fast and Slow - (using Gladwell as placeholder)

-- History books
('9780062316110', 2),  -- Sapiens - Yuval Noah Harari
('9781524763138', 4),  -- Becoming - Michelle Obama
('9780399590504', 5),  -- Educated - Tara Westover
('9780062694690', 8),  -- A People's History - Howard Zinn
('9780393354324', 10), -- Guns, Germs, Steel - Jared Diamond
('9780735211292', 45), -- Atomic Habits - James Clear

-- Religion books
('9780807067048', 6),  -- Man's Search for Meaning - Viktor Frankl
('9780345384560', 9),  -- A History of God - Karen Armstrong
('9780060652937', 27), -- Mere Christianity - C.S. Lewis
('9780061120084', 22), -- The Alchemist - Paulo Coelho
('9780062236845', 49), -- Daring Greatly - Brene Brown

-- Art/Literature books
('9780452284234', 22), -- The Alchemist - Paulo Coelho
('9780316769488', 17), -- Catcher in the Rye - (using Hemingway placeholder)
('9780679783268', 15), -- Pride and Prejudice - Jane Austen
('9780451524935', 12), -- 1984 - George Orwell
('9780061120084', 13), -- To Kill a Mockingbird - Harper Lee
('9780743273565', 14), -- The Great Gatsby - F. Scott Fitzgerald
('9780141439600', 18), -- Great Expectations - Charles Dickens
('9780140449136', 20), -- Crime and Punishment - Dostoevsky
('9780140449242', 19), -- War and Peace - Leo Tolstoy
('9780060883287', 21), -- One Hundred Years of Solitude - Gabriel Garcia Marquez
('9780439708180', 11), -- Harry Potter 1 - J.K. Rowling
('9780439064873', 11), -- Harry Potter 2 - J.K. Rowling
('9780439136365', 11), -- Harry Potter 3 - J.K. Rowling
('9780547928227', 26), -- The Hobbit - J.R.R. Tolkien
('9780544003415', 26), -- Lord of the Rings - J.R.R. Tolkien
('9780007141326', 27), -- Narnia - C.S. Lewis
('9780553293357', 28), -- Foundation - Isaac Asimov
('9780307474728', 23), -- Da Vinci Code - Dan Brown
('9780062073488', 24), -- Murder Orient Express - Agatha Christie
('9781501142970', 25), -- It - Stephen King
('9780385333481', 25), -- The Shining - Stephen King
('9780143127550', 41), -- Handmaid's Tale - Margaret Atwood
('9780307387899', 42), -- The Road - Cormac McCarthy
('9780316055437', 43), -- Secret History - Donna Tartt
('9781501110368', 44), -- It Ends with Us - Colleen Hoover
('9781668001226', 44), -- It Starts with Us - Colleen Hoover
('9781501161933', 44), -- Seven Husbands - (using Hoover placeholder)

-- Geography/Self-help books
('9780316346627', 3),  -- Outliers - Malcolm Gladwell
('9780316017930', 3),  -- Outliers - Malcolm Gladwell
('9780525559474', 50), -- Range - Adam Grant
('9780593135204', 50), -- Think Again - Adam Grant
('9780525429586', 46); -- Deep Work - Cal Newport

-- Insert Sample Customers (password: Customer123!)
INSERT INTO USERS (username, password_hash, email, first_name, last_name, phone_number, address, user_type)
VALUES 
('john_doe','$2a$10$W3nJeN32U3L20SDxWXr8DOgGKVeAK1KP2V9gLcdGPyqgwzAfc656a','john.doe@email.com', 'John', 'Doe', '555-0101', '123 Main St, New York, NY 10001', 'customer'),
('jane_smith','$2a$10$W3nJeN32U3L20SDxWXr8DOgGKVeAK1KP2V9gLcdGPyqgwzAfc656a','jane.smith@email.com', 'Jane', 'Smith', '555-0102', '456 Oak Ave, Los Angeles, CA 90001', 'customer'),
('bob_wilson','$2a$10$W3nJeN32U3L20SDxWXr8DOgGKVeAK1KP2V9gLcdGPyqgwzAfc656a','bob.wilson@email.com', 'Bob', 'Wilson', '555-0103', '789 Pine Rd, Chicago, IL 60601', 'customer'),
('alice_johnson','$2a$10$W3nJeN32U3L20SDxWXr8DOgGKVeAK1KP2V9gLcdGPyqgwzAfc656a','alice.johnson@email.com', 'Alice', 'Johnson', '555-0104', '321 Elm St, Houston, TX 77001', 'customer'),
('charlie_brown','$2a$10$W3nJeN32U3L20SDxWXr8DOgGKVeAK1KP2V9gLcdGPyqgwzAfc656a','charlie.brown@email.com', 'Charlie', 'Brown', '555-0105', '654 Maple Dr, Phoenix, AZ 85001', 'customer');

-- Insert Sample Customer Orders 
INSERT INTO CUSTOMER_ORDERS (user_id, order_date, total_amount, credit_card_number, credit_card_expiry)
VALUES 
(2, DATE_SUB(NOW(), INTERVAL 60 DAY), 68.97, '**** **** **** 4242', '12/29'),  -- john_doe
(3, DATE_SUB(NOW(), INTERVAL 45 DAY), 89.97, '**** **** **** 1111', '11/28'),  -- jane_smith
(4, DATE_SUB(NOW(), INTERVAL 30 DAY), 45.98, '**** **** **** 0002', '08/30'),  -- bob_wilson
(2, DATE_SUB(NOW(), INTERVAL 15 DAY), 132.48, '**** **** **** 4242', '12/29'), -- john_doe (2nd order)
(5, DATE_SUB(NOW(), INTERVAL 7 DAY), 54.98, '**** **** **** 2222', '01/31');   -- charlie_brown


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

-- ============================================
-- NEW FEATURES: Wishlist, Reviews, Password Reset
-- ============================================

-- 9. WISHLISTS Table
CREATE TABLE WISHLISTS (
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_isbn VARCHAR(20) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_wishlist_item (user_id, book_isbn),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_isbn) REFERENCES BOOKS(isbn) ON DELETE CASCADE
);

-- 10. BOOK_REVIEWS Table
CREATE TABLE BOOK_REVIEWS (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    book_isbn VARCHAR(20) NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_review (book_isbn, user_id),
    FOREIGN KEY (book_isbn) REFERENCES BOOKS(isbn) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 11. PASSWORD_RESET_TOKENS Table
CREATE TABLE PASSWORD_RESET_TOKENS (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- Sample Reviews
INSERT INTO BOOK_REVIEWS (book_isbn, user_id, rating, review_title, review_text) VALUES
-- Science books
('9780553380163', 2, 5, 'Mind-blowing!', 'Stephen Hawking makes complex physics accessible to everyone. A must-read for anyone curious about the universe.'),
('9780553380163', 3, 4, 'Great but challenging', 'Excellent book but some parts require multiple reads to fully understand.'),
('9780345539434', 2, 5, 'A masterpiece of science communication', 'Carl Sagan takes you on a journey through the cosmos with poetic prose and scientific rigor.'),
('9780345539434', 4, 5, 'Changed how I see the universe', 'This book sparked my love for astronomy. Beautifully written.'),

-- History books
('9780062316110', 2, 5, 'Changed my perspective', 'Yuval Noah Harari brilliantly traces the history of our species. Thought-provoking and well-researched.'),
('9780062316110', 4, 5, 'Essential reading', 'Everyone should read this book. It will change how you see human history.'),
('9780062316110', 5, 4, 'Fascinating but dense', 'Incredible insights but takes time to digest. Worth every minute.'),
('9781524763138', 5, 5, 'Inspiring memoir', 'Michelle Obama shares her journey with grace and honesty. Truly inspiring.'),
('9781524763138', 3, 5, 'Beautifully written', 'Her story is powerful and relatable. A must-read for everyone.'),
('9780399590504', 2, 5, 'Unforgettable', 'Tara Westover story of self-invention is both harrowing and inspiring.'),
('9780735211292', 3, 5, 'Life-changing!', 'Atomic Habits gave me practical tools to build better habits. Already seeing results!'),
('9780735211292', 4, 5, 'Best self-improvement book ever', 'James Clear breaks down habit formation into actionable steps. Highly recommend.'),
('9780735211292', 5, 4, 'Practical and insightful', 'Great framework for understanding how habits work and how to change them.'),

-- Religion/Philosophy books
('9780807067048', 2, 5, 'Life-changing book', 'Viktor Frankl perspective on finding meaning even in the darkest times is profound.'),
('9780807067048', 3, 5, 'Required reading for humanity', 'This book should be required reading. It teaches resilience and hope.'),
('9780061120084', 4, 5, 'A beautiful journey', 'The Alchemist is a timeless tale about following your dreams. Magical.'),
('9780061120084', 5, 4, 'Inspirational', 'Simple yet profound. The story stays with you long after you finish.'),
('9780060652937', 2, 4, 'Clear and compelling', 'C.S. Lewis makes a strong case for Christianity in accessible language.'),

-- Fiction classics
('9780451524935', 2, 5, 'Terrifyingly relevant', 'Orwell vision of totalitarianism feels more relevant than ever. A masterpiece.'),
('9780451524935', 3, 5, 'A warning for all generations', 'This book should be required reading. The themes are timeless.'),
('9780451524935', 4, 4, 'Chilling and thought-provoking', 'Disturbing in the best way. Makes you think about freedom and truth.'),
('9780743273565', 3, 5, 'The Great American Novel', 'Fitzgerald prose is beautiful. The story of Gatsby is tragic and timeless.'),
('9780743273565', 5, 4, 'Beautifully written', 'The writing is exquisite. A snapshot of the Jazz Age at its finest.'),
('9780679783268', 2, 5, 'Timeless romance', 'Jane Austen wit and social commentary are as fresh today as 200 years ago.'),
('9780679783268', 4, 5, 'Perfect in every way', 'Elizabeth Bennet is one of the best characters in literature. Love this book.'),

-- Harry Potter series
('9780439708180', 2, 5, 'Magic never gets old', 'Reading this as an adult is just as magical as when I was a kid.'),
('9780439708180', 3, 5, 'The book that started it all', 'J.K. Rowling created a world that generations will love forever.'),
('9780439708180', 4, 5, 'Perfect for all ages', 'Introduced my kids to Harry Potter and now we are all hooked!'),
('9780439708180', 5, 4, 'Wonderful beginning', 'Great start to an amazing series. The world-building is fantastic.'),
('9780547928227', 2, 5, 'A perfect adventure', 'Tolkien created the template for all fantasy. Still the best.'),
('9780547928227', 3, 5, 'Timeless classic', 'The Hobbit is pure joy. Bilbo journey is unforgettable.'),
('9780544003415', 4, 5, 'The greatest fantasy ever written', 'Nothing compares to Middle-earth. A masterwork of imagination.'),

-- Modern bestsellers
('9781501110368', 3, 5, 'Emotionally devastating', 'Colleen Hoover knows how to write emotion. I could not put it down.'),
('9781501110368', 5, 4, 'Powerful story', 'Deals with difficult topics with sensitivity. Very moving.'),
('9781501161933', 2, 5, 'Best book I read this year', 'Evelyn Hugo story is captivating. The twists kept me guessing.'),
('9781501161933', 4, 5, 'Unforgettable characters', 'Hollywood glamour with real depth. Absolutely loved it.'),
('9780307474728', 3, 4, 'Page-turner', 'Dan Brown knows how to keep you hooked. Great thriller.'),
('9780062073488', 2, 5, 'The queen of mystery', 'Agatha Christie at her finest. The ending is legendary.'),
('9781501142970', 4, 4, 'Terrifying masterpiece', 'Stephen King at his best. Pennywise will haunt your dreams.'),
('9780143127550', 5, 5, 'Prophetic and chilling', 'Margaret Atwood wrote a warning. Unfortunately still relevant.'),

-- Self-help/Business
('9780316346627', 2, 5, 'Eye-opening', 'Malcolm Gladwell makes you see success differently. Fascinating research.'),
('9780316346627', 4, 4, 'Thought-provoking', 'Interesting perspective on what makes people successful.'),
('9780525429586', 3, 5, 'Essential for the modern age', 'Cal Newport makes a compelling case for focused work. Game-changer.'),
('9780593135204', 2, 5, 'Changed how I think', 'Adam Grant challenges you to reconsider your opinions. Brilliant.');

-- Sample Wishlist items
INSERT INTO WISHLISTS (user_id, book_isbn) VALUES
(2, '9780345539434'),
(2, '9780393354324'),
(2, '9780439708180'),
(2, '9780735211292'),
(3, '9780062316110'),
(3, '9780544003415'),
(3, '9781501161933'),
(4, '9780553380163'),
(4, '9780451524935'),
(4, '9780061120084'),
(5, '9780743273565'),
(5, '9780547928227'),
(5, '9780525429586');

