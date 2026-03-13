require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { User } = require("./models");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Database
const { db, connectDB } = require("./config/db");

// Import Models (must be before sync)
require("./models");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");

const path = require("path");

app.use("/uploads", express.static("uploads"));
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


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  //  when user tells server who they are
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("Online Users:", onlineUsers);

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("privateMessage", (data) => {
  const receiverSocketId = onlineUsers[data.receiver];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receiveMessage", data);
  }
});

  socket.on("disconnect", async () => {

  for (let userId in onlineUsers) {

    if (onlineUsers[userId] === socket.id) {

      // update last seen
      await User.update(
        { last_seen: new Date() },
        { where: { id: userId } }
      );

      delete onlineUsers[userId];
    }

  }

  io.emit("onlineUsers", Object.keys(onlineUsers));
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
