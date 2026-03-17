const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member',
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  indexes: [
    { unique: true, fields: ['groupId', 'userId'] },
  ],
});

module.exports = GroupMember;
