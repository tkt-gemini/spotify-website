const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PodcastEpisode = sequelize.define('PodcastEpisode', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  showId: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
  },
  audio: {
    type: DataTypes.STRING,
  },
  duration_ms: {
    type: DataTypes.INTEGER,
  },
  explicit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'published'
  }
});

module.exports = PodcastEpisode;
