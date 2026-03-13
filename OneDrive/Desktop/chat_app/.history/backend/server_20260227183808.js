//  Socket connection
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;

    console.log("Online Users:", onlineUsers);

    // Send updated list to everyone
    io.emit("onlineUsers", Object.keys(onlineUsers));
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

    io.emit("onlineUsers", Object.keys(onlineUsers));

    console.log("User disconnected:", socket.id);
  });
});