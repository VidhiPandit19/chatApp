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

app.use("/user", userRoutes);
app.use("/", requestRoutes);


// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Attach socket to server
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔥 Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Connect Database + Sync Tables + Start Server
connectDB()
  .then(() => {
    return db.sync();
  })
  .then(() => {
    console.log("tables synced");
    app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error starting server:", err);
  });