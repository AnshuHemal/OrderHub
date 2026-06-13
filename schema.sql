-- Odoo Cafe POS Database Schema for Neon DB (PostgreSQL)

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Table for Users / Employees
CREATE TYPE user_role AS ENUM ('admin', 'employee');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Product Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#E2E8F0', -- Hex code (e.g. #FF5733)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'per piece', -- e.g. per piece, per kg, per litre
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (tax_percentage >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Payment Methods Setup
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g. Cash, Card/Digital, UPI QR
    type VARCHAR(50) NOT NULL, -- e.g. cash, card, upi
    upi_id VARCHAR(255), -- Save custom UPI ID (e.g. cafe@ybl) for QR code generation
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Floors
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g. Ground Floor, Rooftop, Terrace
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Tables (Floor plan)
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    floor_id INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    seats INTEGER NOT NULL CHECK (seats > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (floor_id, table_number)
);

-- Create Table for Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Coupons (Manual Discount Codes)
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Automated Promotions
CREATE TYPE promotion_type AS ENUM ('product', 'order');

CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    promo_type promotion_type NOT NULL,
    -- Product-level promo details
    target_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    min_quantity INTEGER CHECK (min_quantity > 0),
    -- Order-level promo details
    min_order_amount DECIMAL(10, 2) CHECK (min_order_amount >= 0),
    -- Discount to apply
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for POS Sessions
CREATE TYPE session_status AS ENUM ('open', 'closed');

CREATE TABLE pos_sessions (
    id SERIAL PRIMARY KEY,
    opened_by INTEGER NOT NULL REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    closing_balance DECIMAL(10, 2) DEFAULT 0.00,
    status session_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Orders
CREATE TYPE order_status AS ENUM ('draft', 'paid', 'cancelled');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL, -- Can be NULL for Takeaway orders
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    employee_id INTEGER NOT NULL REFERENCES users(id),
    order_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. ORD-2026-0001
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    discounts DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (discounts >= 0),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    status order_status NOT NULL DEFAULT 'draft',
    payment_method_id INTEGER REFERENCES payment_methods(id),
    payment_reference VARCHAR(255), -- e.g. transaction codes or card reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Order Items (Kitchen workflow state managed here)
CREATE TYPE kitchen_stage AS ENUM ('to_cook', 'preparing', 'completed');

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    status kitchen_stage NOT NULL DEFAULT 'to_cook',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Table for Bookings (Table Reservations)
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    booking_time TIMESTAMP WITH TIME ZONE NOT NULL,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    status booking_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- INDEXES for Performance Optimization
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_tables_floor ON tables(floor_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_bookings_time ON bookings(booking_time);
CREATE INDEX idx_users_email ON users(email);


-- SEED MOCK DATA FOR DEMO PURPOSES
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@cafepos.com', 'admin123', 'admin'),
('Cashier John', 'john@cafepos.com', 'cashier123', 'employee'),
('Hemal User', 'hemal@gmail.com', 'Hemu@123', 'admin');

INSERT INTO categories (name, color) VALUES
('Hot Beverages', '#EF4444'), -- Red
('Cold Beverages', '#3B82F6'), -- Blue
('Snacks', '#F59E0B'), -- Yellow/Amber
('Desserts', '#EC4899'), -- Pink
('Bakery', '#10B981'); -- Green

INSERT INTO products (name, category_id, price, unit_of_measure, tax_percentage, description) VALUES
('Espresso', 1, 3.50, 'per piece', 5.00, 'Rich shot of double espresso'),
('Cappuccino', 1, 4.50, 'per piece', 5.00, 'Espresso with steamed milk foam'),
('Iced Latte', 2, 4.80, 'per piece', 5.00, 'Cold milk over ice, with espresso'),
('Avocado Toast', 3, 7.50, 'per piece', 8.00, 'Sourdough with mashed avocado and chilli flakes'),
('Chocolate Brownie', 4, 3.80, 'per piece', 10.00, 'Warm fudge chocolate brownie'),
('Croissant', 5, 3.20, 'per piece', 5.00, 'Flaky butter croissant');

INSERT INTO payment_methods (name, type, upi_id, is_enabled) VALUES
('Cash', 'cash', NULL, true),
('Card/Digital', 'card', NULL, true),
('UPI QR', 'upi', 'cafe@ybl', true);

INSERT INTO floors (name) VALUES
('Ground Floor'),
('Rooftop Lounge');

INSERT INTO tables (floor_id, table_number, seats) VALUES
(1, 'T-101', 2),
(1, 'T-102', 4),
(1, 'T-103', 4),
(1, 'T-104', 6),
(2, 'RT-201', 2),
(2, 'RT-202', 4);

INSERT INTO coupons (code, discount_type, discount_value, is_active) VALUES
('WELCOME10', 'percentage', 10.00, true),
('FLAT5', 'fixed', 5.00, true);

INSERT INTO promotions (name, promo_type, target_product_id, min_quantity, min_order_amount, discount_type, discount_value) VALUES
('Coffee Combo Promo', 'product', 1, 3, NULL, 'percentage', 15.00), -- 15% off order if qty >= 3 Espresso
('Large Order Promo', 'order', NULL, NULL, 30.00, 'fixed', 5.00); -- Flat $5 off if order > $30
