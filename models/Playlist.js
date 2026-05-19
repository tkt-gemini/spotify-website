const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Playlist = sequelize.define('Playlist', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Playlist;
