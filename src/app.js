const express = require("express")
const app = express();
const database = require("./config/database")

const authRoutes = require("./routes/authRoutes")
const addressRoutes = require('./routes/addressRoutes')
const restaurentRoutes = require('./routes/restaurantRoutes')
const cartRoutes = require('./routes/cartRoutes')
const orderRoutes = require('./routes/orderRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const searchRoutes = require('./routes/searchRoutes')


let init = async () => {
    await database.connect();
    await database.initializeSchema();
    // seed();
}

init();

app.use(express.json())

app.use('/api/auth/', authRoutes);
app.use('/api/addresses/', addressRoutes)
app.use('/api/restaurants/', restaurentRoutes)
app.use('/api/cart/', cartRoutes)
app.use('/api/orders/', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/search/', searchRoutes)


app.listen(3000, () => {
    console.log("Server running on port 3000")
})