const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      is: /^[a-zA-Z0-9_.]+$/,
    },
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  bio: {
    type: DataTypes.STRING(200),
    defaultValue: '',
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  socketId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  passwordOtpHash: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  passwordOtpExpires: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  passwordOtpRequestedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  passwordOtpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  passwordOtpBlockedUntil: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.socketId;
  delete values.passwordOtpHash;
  delete values.passwordOtpExpires;
  delete values.passwordOtpRequestedAt;
  delete values.passwordOtpAttempts;
  delete values.passwordOtpBlockedUntil;
  return values;
};

module.exports = User;
