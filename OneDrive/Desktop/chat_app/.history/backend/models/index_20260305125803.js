const { friendRequest, User, Message } = require


// ================= FRIEND REQUEST RELATIONS =================

// Request belongs to sender
friendRequest.belongsTo(User, {
  foreignKey: "sender_Id",
  as: "sender",
  onDelete: "CASCADE",
});

// Request belongs to receiver
friendRequest.belongsTo(User, {
  foreignKey: "receiver_Id",
  as: "receiver",
  onDelete: "CASCADE",
});

// User -> Sent Requests
User.hasMany(friendRequest, {
  foreignKey: "sender_Id",
  as: "sentRequests",
});

// User -> Received Requests
User.hasMany(friendRequest, {
  foreignKey: "receiver_Id",
  as: "receivedRequests",
});


// ================= MESSAGE RELATIONS =================

// Message belongs to sender
Message.belongsTo(User, {
  foreignKey: "sender_Id",
  as: "sender",
  onDelete: "CASCADE",
});

// Message belongs to receiver
Message.belongsTo(User, {
  foreignKey: "receiver_Id",
  as: "receiver",
  onDelete: "CASCADE",
});

// User -> Sent Messages
User.hasMany(Message, {
  foreignKey: "sender_Id",
  as: "sentMessages",
});

// User -> Received Messages
User.hasMany(Message, {
  foreignKey: "receiver_Id",
  as: "receivedMessages",
});


module.exports = { User, friendRequest, Message };