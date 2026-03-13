const { Sequelize } = require("sequelize");

const db = new Sequelize(
  process.env.DATABASE,
  process.env.USERNAME,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
  }
);

const connectDB = async () => {
  try {
    await db.authenticate();
    console.log("✅ Database is connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

module.exports = { db, connectDB };
