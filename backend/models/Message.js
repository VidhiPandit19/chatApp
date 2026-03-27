const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'call_log', 'system'),
    defaultValue: 'text',
  },
  fileUrl: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  fileName: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  replyToId: {
    type: DataTypes.UUID,
    defaultValue: null,
    references: { model: 'Messages', key: 'id' },
    onDelete: 'SET NULL',
  },
  isForwarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  editedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  deletedForEveryone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedBySender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deletedByReceiver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  seenAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'seen'),
    defaultValue: 'sent',
  },
  reactions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

module.exports = Message;
