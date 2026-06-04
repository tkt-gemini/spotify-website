const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const PlaybackSession = sequelize.define('PlaybackSession', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contextType: {
    type: DataTypes.STRING,
    allowNull: true // 'playlist', 'album', 'artist', etc.
  },
  contextId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentTrackId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  progressMs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = PlaybackSession;
