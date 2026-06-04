const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PlayHistory = sequelize.define('PlayHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trackId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true // Could be null for anonymous listeners
  },
  playedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  artistName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['trackId'] }
  ]
});

module.exports = PlayHistory;
