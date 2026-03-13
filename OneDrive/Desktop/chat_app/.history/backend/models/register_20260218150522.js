const { DataTypes } = require("sequelize");
const { db } = require("../config/db");

const User = db.define("User", {
    name: {
        type: DataTypes.STRING,
         
    }

    email: {
        type:DataTypes.m
    }
})