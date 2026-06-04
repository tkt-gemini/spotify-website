const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Album = sequelize.define('Album', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artistId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cover: {
    type: DataTypes.STRING,
    allowNull: true
  },
  releaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Album;
