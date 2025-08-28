# Food Delivery Backend — README, Database Schema & Seeds

> This document contains: project overview, setup instructions, placeholder for schema, placeholder for seeds, API documentation (endpoints + behaviors), folder structure, design decisions, and implementation notes.

---

## Table of contents

1. Project overview
2. Quick start (setup)
3. Folder structure
4. Environment variables
5. Database schema (`schema.sql`)
6. Seed data (`seeds.sql`)
7. API endpoints (documentation)
8. Middleware & security
9. Implementation notes & design decisions
10. Postman collection & testing
11. Assumptions
12. Next steps / bonus features

---

## 1. Project overview

A Node.js + Express backend with SQLite (dev) and JWT-based authentication for a food delivery platform. Core features implemented/provided here:

* Users, addresses, restaurants, menus, carts, orders, order tracking, payments, reviews, delivery partners.
* Strong schema with constraints, foreign keys, and indexes for location queries.
* Seed generator to populate the DB with sample data (20 restaurants × 10 items each).
* API spec for endpoints, validation rules, and expected responses.

---

## 2. Quick start (development)

1. Clone repository

```bash
git clone <your-repo-url>
cd food-delivery-backend
```

2. Install dependencies

```bash
npm install
```

3. Create `.env` file (see section Environment variables)

4. Initialize database

```bash
sqlite3 database/dev.sqlite < database/schema.sql
sqlite3 database/dev.sqlite < database/seeds.sql
```

5. Start dev server

```bash
npm run dev
# or
node src/app.js
```

6. Import the provided Postman collection and test endpoints.

---

## 3. Folder structure

```
food-delivery-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── app.js
├── database/
│   ├── schema.sql
│   └── seeds.sql
├── .env
├── package.json
└── README.md
```

---

## 4. Environment variables

```
PORT=3000
JWT_SECRET=replace_with_secure_random_value
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
DB_PATH=./database/dev.sqlite
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

---

## 5. Database schema (`schema.sql`)

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


---

## 6. Seed data (`seeds.sql`)

-- ===============================
-- Seed Data for Food Delivery App
-- ===============================

-- Users
INSERT INTO users (name, email, password, phone) VALUES
('Alice Johnson', 'alice@example.com', 'hashed_password_1', '9876543210'),
('Bob Smith', 'bob@example.com', 'hashed_password_2', '9123456780'),
('Charlie Brown', 'charlie@example.com', 'hashed_password_3', '9988776655');

-- Addresses
INSERT INTO addresses (user_id, type, address_line1, address_line2, city, state, pincode, latitude, longitude) VALUES
(1, 'home', '123 MG Road', 'Apt 101', 'Bengaluru', 'Karnataka', '560001', 12.9716, 77.5946),
(1, 'work', 'Tech Park Phase 2', 'Block B', 'Bengaluru', 'Karnataka', '560103', 12.9352, 77.6245),
(2, 'home', '45 Lake View', NULL, 'Mumbai', 'Maharashtra', '400001', 19.0760, 72.8777),
(3, 'home', '221 Baker Street', NULL, 'Delhi', 'Delhi', '110001', 28.7041, 77.1025);

-- Update users default address
UPDATE users SET default_address_id = 1 WHERE id = 1;
UPDATE users SET default_address_id = 3 WHERE id = 2;
UPDATE users SET default_address_id = 4 WHERE id = 3;

-- Restaurants
INSERT INTO restaurants (name, cuisine, description, address, latitude, longitude, opening_time, closing_time, min_order_amount, delivery_fee, avg_prep_time, status, rating) VALUES
('Spice Villa', 'Indian', 'Authentic North Indian Cuisine', '12 MG Road, Bengaluru', 12.9719, 77.5937, '09:00', '23:00', 200, 30, 25, 'open', 4.5),
('Dragon Wok', 'Chinese', 'Delicious Chinese Food', '5 Residency Road, Bengaluru', 12.9750, 77.6050, '11:00', '23:30', 250, 40, 30, 'open', 4.2),
('Pizza Mania', 'Italian', 'Freshly baked pizzas and pastas', 'HSR Layout, Bengaluru', 12.9100, 77.6410, '10:00', '23:00', 300, 50, 20, 'closed', 4.7);

-- Menu Categories
INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES
(1, 'Starters', 1),
(1, 'Main Course', 2),
(2, 'Noodles', 1),
(2, 'Rice', 2),
(3, 'Pizza', 1),
(3, 'Pasta', 2);

-- Menu Items
INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_veg, is_available) VALUES
(1, 1, 'Paneer Tikka', 'Grilled paneer with spices', 180, 1, 1),
(2, 1, 'Butter Chicken', 'Classic creamy chicken curry', 250, 0, 1),
(3, 2, 'Hakka Noodles', 'Stir-fried noodles with veggies', 150, 1, 1),
(4, 2, 'Egg Fried Rice', 'Rice tossed with egg & sauces', 160, 0, 1),
(5, 3, 'Margherita Pizza', 'Cheese and tomato base', 300, 1, 1),
(6, 3, 'Chicken Alfredo Pasta', 'Creamy chicken pasta', 350, 0, 1);

-- Cart
INSERT INTO cart (user_id, restaurant_id) VALUES
(1, 1),
(2, 2);

-- Cart Items
INSERT INTO cart_items (cart_id, item_id, quantity, special_instructions) VALUES
(1, 1, 2, 'Extra spicy'),
(1, 2, 1, 'Less oily'),
(2, 3, 1, NULL);

-- Orders
INSERT INTO orders (user_id, restaurant_id, address_id, status, total_amount, delivery_fee, payment_method, special_instructions) VALUES
(1, 1, 1, 'delivered', 610, 30, 'card', 'Ring bell on arrival'),
(2, 2, 3, 'pending', 190, 40, 'cash', NULL);

-- Order Items
INSERT INTO order_items (order_id, item_id, name, price, quantity, special_instructions) VALUES
(1, 1, 'Paneer Tikka', 180, 2, 'Extra spicy'),
(1, 2, 'Butter Chicken', 250, 1, 'Less oily'),
(2, 3, 'Hakka Noodles', 150, 1, NULL);

-- Delivery Partners
INSERT INTO delivery_partners (name, phone, status, latitude, longitude) VALUES
('Ramesh Kumar', '9998887770', 'available', 12.9720, 77.5940),
('Suresh Gupta', '8887776660', 'busy', 12.9760, 77.5990);

-- Order Tracking
INSERT INTO order_tracking (order_id, status) VALUES
(1, 'Order Placed'),
(1, 'Being Prepared'),
(1, 'Out for Delivery'),
(1, 'Delivered'),
(2, 'Order Placed');

-- Payments
INSERT INTO payments (order_id, method, status, amount) VALUES
(1, 'card', 'successful', 640),
(2, 'cash', 'pending', 190);

-- Reviews
INSERT INTO reviews (order_id, restaurant_id, restaurant_rating, food_rating, delivery_rating, comment) VALUES
(1, 1, 5, 5, 5, 'Excellent food and delivery!'),
(2, 2, 4, 4, 3, 'Food was good but delivery was delayed.');


---

## 7. API endpoints (documentation)

Endpoints as per assignment (Auth, Addresses, Restaurants, Cart, Orders, Payments, Reviews, Search, Restaurant Management). Validation, authentication requirements, and example requests/responses are detailed in the project spec.

---

## 8. Middleware & security

* **Authentication**: JWT
* **Validation**: `express-validator`
* **Password hashing**: bcrypt
* **SQL injection prevention**: parameterized queries
* **Rate limiting**: `express-rate-limit`
* **Logging**: `morgan` or custom middleware

---

## 9. Implementation notes & design decisions

* Coordinates stored for addresses and restaurants.
* Order items capture price at time of order.
* Order UUID generated uniquely.
* Cart restricted to single restaurant.
* Restaurant open/close determined from operating hours.

---

## 10. Postman collection & testing

Provide a collection with all endpoints grouped logically (auth, addresses, restaurants, cart, orders, payments, reviews, restaurant management).

---

## 11. Assumptions

* Currency stored as integer (smallest unit).
* Delivery area based on radius, not polygons.
* Payments simulated, no external gateway integration.

---

## 12. Next steps / Bonus features

* Real-time tracking via WebSockets
* Delivery partner assignment by nearest partner
* Promo codes, surge pricing
* Analytics dashboard
* Group ordering and recommendations

---

*End of document.*
