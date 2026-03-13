require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

// Database
const { db, connectDB } = require("./config/db");

// Import Models (must be before sync)
require("./models");

// Middleware
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");

app.use("/users", userRoutes);
app.use("/", requestRoutes);
app.use("/messages", messageRoutes);

// Connect Database + Sync Tables + Start Server
connectDB()
  .then(() => {
    return db.sync();
  })
  .then(() => {
    console.log("Database connected & tables synced");
    app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error starting server:", err);
  });