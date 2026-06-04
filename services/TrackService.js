const { Op } = require('sequelize');
const { Track, PlayHistory, Playlist } = require('../models');

class TrackService {
  async getTrack(id) {
    const track = await Track.findOne({ where: { id } });
    if (!track) throw new Error('NOT_FOUND');
    return track;
  }

  async recordPlay(id, userId) {
    const track = await Track.findOne({ where: { id } });
    if (!track) throw new Error('NOT_FOUND');

    await track.increment('playCount');

    await PlayHistory.create({
      trackId: track.id,
      userId: userId,
      artistName: track.artist
    });

    return track.playCount + 1; // It was incremented
  }

  async addToPlaylists(trackId, playlistIds, userId) {
    const track = await Track.findOne({ where: { id: trackId } });
    if (!track) throw new Error('NOT_FOUND');

    const playlists = await Playlist.findAll({
      where: {
        id: { [Op.in]: playlistIds },
        creatorId: userId
      }
    });

    if (playlists.length === 0) throw new Error('NOT_FOUND');

    for (const playlist of playlists) {
      await playlist.addTrack(track);
    }
    return true;
  }

  async removeFromPlaylists(trackId, playlistIds, userId) {
    const track = await Track.findOne({ where: { id: trackId } });
    if (!track) throw new Error('NOT_FOUND');

    const playlists = await Playlist.findAll({
      where: {
        id: { [Op.in]: playlistIds },
        creatorId: userId
      }
    });

    if (playlists.length === 0) throw new Error('NOT_FOUND');

    for (const playlist of playlists) {
      await playlist.removeTrack(track);
    }
    return true;
  }
}

module.exports = new TrackService();
