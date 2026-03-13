const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const message = sequelize.define("message", {
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

module.exports = message;