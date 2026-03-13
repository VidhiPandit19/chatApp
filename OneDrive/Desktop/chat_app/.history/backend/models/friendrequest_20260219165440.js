const { DataTypes } = require("sequelize");
const { db } = require("../config/db");

const friendRequest = db.define("FriendRequest", {
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending", // pending, accepted, rejected
  },
});

module.exports = FriendRequest;
