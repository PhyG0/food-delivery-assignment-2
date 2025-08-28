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
