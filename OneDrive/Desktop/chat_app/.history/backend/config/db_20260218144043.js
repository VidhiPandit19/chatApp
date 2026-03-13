const { Sequelize } = require("sequelize");
require('do')

const db = new Sequelize(
    process.env.DATABASE,
    process.env.USERNAME,
    process.env.PASSWORD, 
    {
        host: process.env.HOST,
        dialect : process.env.DIALECT 
    }
)

try {
    db.authenticate();
    console.log("Database is connected");
} catch(err) {
    console.log("Database failed");
}