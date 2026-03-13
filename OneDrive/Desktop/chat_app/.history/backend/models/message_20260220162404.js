const { DataTypes } = require("sequelize");
const sequelize = require("../config/");

const Message = sequelize.define("Message", {
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