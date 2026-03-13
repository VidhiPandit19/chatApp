const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("message", {
  sender_Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiver_Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = Message;