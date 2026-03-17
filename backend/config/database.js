const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'true' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully');

    const env = String(process.env.NODE_ENV || 'development').toLowerCase();
    const shouldAlter =
      env === 'development' &&
      String(process.env.DB_SYNC_ALTER || 'false').toLowerCase() === 'true';

    await sequelize.sync(shouldAlter ? { alter: true } : undefined);

    // Backward-compatible schema patch for existing DBs when alter is disabled.
    const queryInterface = sequelize.getQueryInterface();
    const groupMembersTable = await queryInterface.describeTable('GroupMembers');
    if (!groupMembersTable.unreadCount) {
      await queryInterface.addColumn('GroupMembers', 'unreadCount', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      console.log('⚠️ Added missing GroupMembers.unreadCount column');
    }

    const messagesTable = await queryInterface.describeTable('Messages');
    if (messagesTable.conversationId && messagesTable.conversationId.allowNull === false) {
      await queryInterface.changeColumn('Messages', 'conversationId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
      console.log('⚠️ Updated Messages.conversationId to allow NULL');
    }

    const [typeColumnRows] = await sequelize.query("SHOW COLUMNS FROM Messages LIKE 'type'");
    const messageTypeColumn = Array.isArray(typeColumnRows) && typeColumnRows.length > 0 ? typeColumnRows[0] : null;
    const enumSpec = String(messageTypeColumn?.Type || '').toLowerCase();
    if (enumSpec && !enumSpec.includes("'system'")) {
      await sequelize.query(
        "ALTER TABLE Messages MODIFY COLUMN type ENUM('text','image','file','audio','call_log','system') NOT NULL DEFAULT 'text'"
      );
      console.log("⚠️ Updated Messages.type enum to include 'system'");
    }

    if (shouldAlter) {
      console.log('⚠️ Sequelize sync running with alter=true (development only)');
    }

    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };


