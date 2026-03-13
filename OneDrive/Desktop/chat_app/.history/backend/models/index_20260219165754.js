const User = require("./User");
const friendRequest = require("./friendrequest");

//request from sender
friendRequest.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender",
    onDelete: "CASCADE",
});

//to rec
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