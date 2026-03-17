const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lastMessageId: {
    type: DataTypes.UUID,
    defaultValue: null,
  },
});

module.exports = Group;
