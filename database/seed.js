const db = require('../src/config/database');

async function seed() {
    try {
        await db.connect();

        // Clear old data
        await db.run(`DELETE FROM restaurants`);
        await db.run(`DELETE FROM menu_categories`);
        await db.run(`DELETE FROM menu_items`);

        // Insert restaurants
        const r1 = await db.run(
            `INSERT INTO restaurants 
            (name, cuisine, description, address, latitude, longitude, opening_time, closing_time, min_order_amount, delivery_fee, avg_prep_time, status, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "Pizza Paradise",
                "Italian,Fast Food",
                "Best pizzas in town",
                "123 Food Street, Mumbai",
                19.0760,
                72.8777,
                "11:00 AM",
                "11:00 PM",
                200,
                40,
                30,
                "open",
                4.2
            ]
        );

        const r2 = await db.run(
            `INSERT INTO restaurants 
            (name, cuisine, description, address, latitude, longitude, opening_time, closing_time, min_order_amount, delivery_fee, avg_prep_time, status, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "Veggie Delight",
                "Indian,Vegetarian",
                "Pure vegetarian delicacies",
                "45 Green Park, Mumbai",
                19.0810,
                72.8800,
                "10:00 AM",
                "10:00 PM",
                150,
                20,
                25,
                "open",
                4.6
            ]
        );

        // Insert menu categories
        const cat1 = await db.run(
            `INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)`,
            [r1.lastID, "Pizzas", 1]
        );

        const cat2 = await db.run(
            `INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)`,
            [r2.lastID, "Main Course", 1]
        );

        const cat3 = await db.run(
            `INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)`,
            [r2.lastID, "Breads", 2]
        );

        // Insert menu items
        await db.run(
            `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_veg, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cat1.lastID, r1.lastID, "Margherita Pizza", "Classic pizza with mozzarella and basil", 299, 1, 1]
        );

        await db.run(
            `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_veg, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cat1.lastID, r1.lastID, "Pepperoni Pizza", "Loaded with pepperoni & cheese", 399, 0, 1]
        );

        await db.run(
            `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_veg, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cat2.lastID, r2.lastID, "Paneer Butter Masala", "Creamy tomato-based curry with paneer cubes", 250, 1, 1]
        );

        await db.run(
            `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_veg, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [cat3.lastID, r2.lastID, "Butter Naan", "Soft naan with butter topping", 50, 1, 1]
        );

        console.log("✅ Seed data inserted successfully");
        await db.close();
    } catch (err) {
        console.error("❌ Error seeding data:", err);
    }
}

