const { Sequelize } = require("sequelize");

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
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
