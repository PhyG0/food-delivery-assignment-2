-- ===============================
-- Users
-- ===============================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    default_address_id INTEGER,
    FOREIGN KEY (default_address_id) REFERENCES addresses(id)
);

-- ===============================
-- Addresses
-- ===============================
CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('home','work','other')) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================
-- Restaurants
-- ===============================
CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    opening_time TEXT NOT NULL,
    closing_time TEXT NOT NULL,
    min_order_amount REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    avg_prep_time INTEGER NOT NULL,
    status TEXT CHECK(status IN ('open','closed')) NOT NULL DEFAULT 'closed',
    rating REAL DEFAULT 0
);

-- ===============================
-- Menu Categories
-- ===============================
CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- ===============================
-- Menu Items
-- ===============================
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    is_veg BOOLEAN NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- ===============================
-- Cart
-- ===============================
CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    special_instructions TEXT,
    FOREIGN KEY (cart_id) REFERENCES cart(id),
    FOREIGN KEY (item_id) REFERENCES menu_items(id)
);

-- ===============================
-- Orders
-- ===============================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    total_amount REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    payment_method TEXT NOT NULL,
    special_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- ===============================
-- Order Items
-- ===============================
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- snapshot of name
    price REAL NOT NULL, -- snapshot of price
    quantity INTEGER NOT NULL,
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ===============================
-- Delivery Partners
-- ===============================
CREATE TABLE IF NOT EXISTS delivery_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT CHECK(status IN ('available','busy')) NOT NULL DEFAULT 'available',
    latitude REAL,
    longitude REAL
);

-- ===============================
-- Order Tracking
-- ===============================
CREATE TABLE IF NOT EXISTS order_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ===============================
-- Payments
-- ===============================
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ===============================
-- Reviews
-- ===============================
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    restaurant_rating INTEGER,
    food_rating INTEGER,
    delivery_rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
