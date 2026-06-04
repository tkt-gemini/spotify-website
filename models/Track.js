const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Track = sequelize.define('Track', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artist: {
    type: DataTypes.STRING,
    allowNull: true
  },
  artistId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  albumId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cover: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lyrics: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  audio: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // 'song' or 'podcast'
    allowNull: false,
    defaultValue: 'song'
  },
  playCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Track;
