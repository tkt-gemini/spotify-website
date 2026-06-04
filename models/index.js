const sequelize = require('../database/connection');
const User = require('./User');
const Track = require('./Track');
const Playlist = require('./Playlist');
const PlayHistory = require('./PlayHistory');
const ArtistProfile = require('./ArtistProfile');
const PodcasterProfile = require('./PodcasterProfile');
const LibraryItem = require('./LibraryItem');
const PodcastShow = require('./PodcastShow');
const PodcastEpisode = require('./PodcastEpisode');
const Album = require('./Album');
const Audiobook = require('./Audiobook');
const PlaybackSession = require('./PlaybackSession');
const QueueItem = require('./QueueItem');

// Define Many-to-Many relationship between Playlist and Track
Playlist.belongsToMany(Track, { through: 'PlaylistTracks', as: 'tracks' });
Track.belongsToMany(Playlist, { through: 'PlaylistTracks', as: 'playlists' });

// User and Profiles
User.hasOne(ArtistProfile, { foreignKey: 'userId', as: 'artistProfile' });
ArtistProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(PodcasterProfile, { foreignKey: 'userId', as: 'podcasterProfile' });
PodcasterProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Podcast relations
PodcastShow.hasMany(PodcastEpisode, { foreignKey: 'showId', as: 'episodes' });
PodcastEpisode.belongsTo(PodcastShow, { foreignKey: 'showId', as: 'show' });

User.hasMany(PodcastShow, { foreignKey: 'ownerId', as: 'podcastShows' });
PodcastShow.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Profile and Tracks
ArtistProfile.hasMany(Track, { foreignKey: 'artistId', as: 'tracks' });
Track.belongsTo(ArtistProfile, { foreignKey: 'artistId', as: 'artistProfile' });

// Album relations
ArtistProfile.hasMany(Album, { foreignKey: 'artistId', as: 'albums' });
Album.belongsTo(ArtistProfile, { foreignKey: 'artistId', as: 'artist' });

Album.hasMany(Track, { foreignKey: 'albumId', as: 'tracks' });
Track.belongsTo(Album, { foreignKey: 'albumId', as: 'album' });

// User and Playlists
User.hasMany(Playlist, { foreignKey: 'creatorId', as: 'playlists' });
Playlist.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// User and LibraryItems
User.hasMany(LibraryItem, { foreignKey: 'userId', as: 'libraryItems' });
LibraryItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User and PlayHistory
User.hasMany(PlayHistory, { foreignKey: 'userId', as: 'playHistory' });
PlayHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Track and PlayHistory
Track.hasMany(PlayHistory, { foreignKey: 'trackId', as: 'history' });
PlayHistory.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

// PlaybackSession and QueueItem
User.hasOne(PlaybackSession, { foreignKey: 'userId', as: 'playbackSession' });
PlaybackSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

PlaybackSession.hasMany(QueueItem, { foreignKey: 'sessionId', as: 'queue' });
QueueItem.belongsTo(PlaybackSession, { foreignKey: 'sessionId', as: 'session' });

Track.hasMany(QueueItem, { foreignKey: 'trackId', as: 'queueItems' });
QueueItem.belongsTo(Track, { foreignKey: 'trackId', as: 'track' });

module.exports = {
  sequelize,
  User,
  Track,
  Playlist,
  PlayHistory,
  ArtistProfile,
  PodcasterProfile,
  LibraryItem,
  PodcastShow,
  PodcastEpisode,
  Album,
  Audiobook,
  PlaybackSession,
  QueueItem
};
