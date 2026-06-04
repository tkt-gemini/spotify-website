const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Audiobook = sequelize.define('Audiobook', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  narrator: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cover: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Audiobook;
