const { DataTypes } = require("sequelize");
const { db } = require("../config/db");

const User = db.define("User", {

    email: {
        type:DataTypes.STRING,
        allowNull:false,
        unique: true
    }
})