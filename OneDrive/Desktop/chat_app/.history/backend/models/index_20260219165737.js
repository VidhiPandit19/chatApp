const User = require("./User");
const friendRequest = require("./friendrequest");


friendRequest.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender",
    onDelete: "CASCADE",
});

FriendRequest.belongsTo(User, {
  foreignKey: "receiverId",
  as: "receiver",
  onDelete: "CASCADE",
});

// User → Sent Requests
User.hasMany(FriendRequest, {
  foreignKey: "senderId",
  as: "sentRequests",
});

// User → Received Requests
User.hasMany(FriendRequest, {
  foreignKey: "receiverId",
  as: "receivedRequests",
});

module.exports = {
  User,
  FriendRequest,
};