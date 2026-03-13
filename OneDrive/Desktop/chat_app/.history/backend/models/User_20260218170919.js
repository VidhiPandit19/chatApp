const { DataTypes } = require("sequelize");
const {db, connectDb} = require("../config/db");

const User = db.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobile_number: {
    type: DataTypes.STRING,
    allowNull: false // set to true if existing users have NULL
  }
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;
