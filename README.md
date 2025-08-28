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


# 🍴 Food Delivery App Database Schema


## 📑 Schema Overview

### 1. Users
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    default_address_id INTEGER,
    FOREIGN KEY (default_address_id) REFERENCES addresses(id)
);
```

### 2. Addresses
```sql
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
```

### 3. Restaurants
```sql
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
```

### 4. Menu Categories
```sql
CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
```

### 5. Menu Items
```sql
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
```

### 6. Cart & Cart Items
```sql
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
```

### 7. Orders & Order Items
```sql
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
```

### 8. Delivery Partners
```sql
CREATE TABLE IF NOT EXISTS delivery_partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT CHECK(status IN ('available','busy')) NOT NULL DEFAULT 'available',
    latitude REAL,
    longitude REAL
);
```

### 9. Order Tracking
```sql
CREATE TABLE IF NOT EXISTS order_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 10. Payments
```sql
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 11. Reviews
```sql
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
```

---

## 🚀 Features Covered
- **Users & Addresses** – Store customer profiles and delivery locations.  
- **Restaurants & Menus** – Restaurant info, categories, and items.  
- **Cart & Orders** – Support for cart, checkout, and multiple items per order.  
- **Delivery Tracking** – Track orders with delivery partners.  
- **Payments** – Payment methods and transactions.  
- **Reviews & Ratings** – Feedback on restaurants, food, and delivery.  

---

## 📌 Notes
- Database designed for **SQLite**, but works with **PostgreSQL/MySQL** with small modifications.  
- Some fields like `created_at`, `status`, `rating` have sensible defaults.  
- Snapshots in `order_items` ensure data consistency even if menu prices change later.  

---



---

## 6. Seed data (`seeds.sql`)

## 📂 Files

- **seed.sql** → Populates the database with sample data for testing.  

---

## 🗄️ Database Schema Overview

### 1. Users & Addresses
- `users` → Stores customer accounts.  
- `addresses` → Stores multiple addresses for each user (home, work, other).  

### 2. Restaurants & Menus
- `restaurants` → Restaurant details including timings, fees, and ratings.  
- `menu_categories` → Categories like "Starters", "Pizza", etc.  
- `menu_items` → Food items with price, availability, and veg/non-veg info.  

### 3. Cart & Orders
- `cart` → Temporary user cart (one per restaurant).  
- `cart_items` → Items inside the cart.  
- `orders` → Finalized orders with status, payment method, and delivery details.  
- `order_items` → Snapshot of ordered items (price, name, quantity).  

### 4. Delivery & Payments
- `delivery_partners` → Delivery staff and their availability.  
- `order_tracking` → Tracks order status updates over time.  
- `payments` → Records payment details.  

### 5. Reviews
- `reviews` → Stores feedback with ratings (restaurant, food, delivery).  

---

## ▶️ How to Use

### 1. Create Database
```bash
sqlite3 food_delivery.db < schema.sql


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