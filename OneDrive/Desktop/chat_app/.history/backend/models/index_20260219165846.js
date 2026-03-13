const User = require("./User");
const friendRequest = require("./friendrequest");

//request from sender
friendRequest.belongsTo(User, {
    foreignKey: "sender_Id",
    as: "sender",
    onDelete: "CASCADE",
});

//to receiver
friendRequest.belongsTo(User, {
  foreignKey: "receiver_Id",
  as: "receiver",
  onDelete: "CASCADE",
});

// User → Sent Requests
User.hasMany(friendRequest, {
  foreignKey: "sender_Id",
  as: "sentRequests",
});

// User → Received Requests
User.hasMany(friendRequest, {
  foreignKey: "receiver_Id",
  as: "receivedRequests",
});

module.exports = { User, friendRequest,
};