const { DataTypes } = require("sequelize");
const { db } = require("../config/db");

const friendRequest = db.define("friendRequest", {
  sender_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  receiver_Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  message: {
    type: DataTypes.STRING,
    allowNull: false 
  }

  status: {
    type: DataTypes.STRING,
    defaultValue: "pending", // pending, accepted, rejected
  },
});

module.exports = friendRequest;
