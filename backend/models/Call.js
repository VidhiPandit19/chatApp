const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Call = sequelize.define('Call', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  callerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('voice', 'video'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('calling', 'accepted', 'rejected', 'missed', 'ended'),
    defaultValue: 'calling',
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  endedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  duration: {
    type: DataTypes.INTEGER, // seconds
    defaultValue: 0,
  },
});

module.exports = Call;
