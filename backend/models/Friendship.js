const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
    defaultValue: 'pending',
  },
}, {
  indexes: [
    { unique: true, fields: ['requesterId', 'receiverId'] },
  ],
});

module.exports = Friendship;
