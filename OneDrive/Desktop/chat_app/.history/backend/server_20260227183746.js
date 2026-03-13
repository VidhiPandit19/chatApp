//  Socket connection
const onlineUsers = {};



io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  //  When user registers after login
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;

    console.log("Online Users:", onlineUsers);

    // ✅ Send updated online users list to everyone
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  //  Private messaging
  socket.on("privateMessage", (data) => {
    const receiverSocketId = onlineUsers[data.receiver];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", data);
    }
  });

  //  When user disconnects
  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }

    console.log("User disconnected:", socket.id);

    // ✅ Send updated online users list again
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});