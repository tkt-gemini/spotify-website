const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PodcastShow = sequelize.define('PodcastShow', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
  },
  cover: {
    type: DataTypes.STRING,
  },
  category: {
    type: DataTypes.STRING,
  },
  language: {
    type: DataTypes.STRING,
  },
  explicit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
});

module.exports = PodcastShow;
