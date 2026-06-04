const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const LibraryItem = sequelize.define('LibraryItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  itemType: {
    type: DataTypes.STRING, // 'artist', 'podcast', 'playlist'
    allowNull: false
  },
  itemId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'itemType', 'itemId'], unique: true }
  ]
});

module.exports = LibraryItem;
