const sequelize = require('../database/connection');
const User = require('./User');
const Track = require('./Track');
const Playlist = require('./Playlist');

// Define Many-to-Many relationship between Playlist and Track
Playlist.belongsToMany(Track, { through: 'PlaylistTracks', as: 'tracks' });
Track.belongsToMany(Playlist, { through: 'PlaylistTracks', as: 'playlists' });

module.exports = {
  sequelize,
  User,
  Track,
  Playlist
};
