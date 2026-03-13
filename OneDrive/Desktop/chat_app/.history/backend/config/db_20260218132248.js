const { Sequelize } = require("sequelize");

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
    console.log("database is connected");
}