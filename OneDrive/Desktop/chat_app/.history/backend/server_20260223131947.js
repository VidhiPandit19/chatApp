require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

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


//  Create HTTP server
const server = http.createServer(app);

//  Attach socket to server
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);

//  Socket connection
const onlineUsers = {};

app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  //  when user tells server who they are
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("Online Users:", onlineUsers);
  });

  socket.on("privateMessage", (data) => {
  const receiverSocketId = onlineUsers[data.receiver];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receiveMessage", data);
  }
});

  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
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
    server.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error starting server:", err);
  });