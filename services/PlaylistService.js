const crypto = require('crypto');
const { Op } = require('sequelize');
const { Playlist, Track, User, LibraryItem, PlayHistory } = require('../models');

class PlaylistService {
  async createPlaylist(creatorId) {
    const count = await Playlist.count({ where: { creatorId } });
    const playlistNumber = count + 1;
    const id = crypto.randomUUID();
    const title = `My playlist #${playlistNumber}`;
    
    return await Playlist.create({
      id,
      title,
      creatorId
    });
  }

  async createFolder(creatorId) {
    const count = await Playlist.count({ where: { creatorId, isFolder: true } });
    const folderNumber = count + 1;
    const id = crypto.randomUUID();
    const title = `New Folder ${folderNumber}`;
    
    return await Playlist.create({
      id,
      title,
      creatorId,
      isFolder: true
    });
  }

  async getPlaylistDetails(id, userId) {
    // Intercept virtual artist follow playlists
    if (id.startsWith('follow::')) {
      const parts = id.split('::');
      const artistName = parts[1];
      const tracks = await Track.findAll({ where: { artist: artistName } });
      
      const followersCount = await Playlist.count({ 
        where: { id: { [Op.like]: `follow::${artistName}::%` } } 
      });
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyListeners = await PlayHistory.count({
        where: {
          artistName: artistName,
          playedAt: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        distinct: true,
        col: 'userId'
      });
      
      const playlist = {
        id: id,
        title: artistName,
        creator: artistName, // Conceptually owned by the artist
        isPublic: true,
        tracks: tracks,
        type: 'artist',
        followersCount: followersCount,
        monthlyListeners: monthlyListeners
      };
      
      return { playlist, creatorName: artistName };
    }

    const playlist = await Playlist.findOne({
      where: { id },
      include: [{ model: Track, as: 'tracks' }]
    });

    if (!playlist) throw new Error('NOT_FOUND');

    // Check visibility / ownership
    if (!playlist.isPublic && playlist.creatorId !== userId) {
      throw new Error('FORBIDDEN');
    }

    const creatorUser = await User.findOne({ where: { id: playlist.creatorId } });
    const creatorName = creatorUser ? creatorUser.name : 'Unknown';

    return { playlist, creatorName };
  }

  async updatePlaylist(id, userId, data, coverFile) {
    const playlist = await Playlist.findOne({ where: { id, creatorId: userId } });
    if (!playlist) throw new Error('NOT_FOUND');

    if (data.title !== undefined) playlist.title = data.title;
    if (data.description !== undefined) playlist.description = data.description;
    if (data.isPublic !== undefined) playlist.isPublic = (data.isPublic === 'true' || data.isPublic === true);
    if (data.parentId !== undefined) {
      // If moving to root, client might send empty string or 'null'
      if (!data.parentId || data.parentId === 'null' || data.parentId === 'none') {
        playlist.parentId = null;
      } else {
        // Basic check to prevent assigning folder to itself
        if (data.parentId !== id) {
          playlist.parentId = data.parentId;
        }
      }
    }

    if (coverFile) {
      playlist.cover = '/uploads/playlists/' + coverFile.filename;
    }

    await playlist.save();
    
    return playlist;
  }

  async deletePlaylist(id, userId) {
    if (id.startsWith('follow::')) {
      return await Playlist.destroy({ where: { id, creatorId: userId } });
    }

    const playlist = await Playlist.findOne({
      where: { id, creatorId: userId }
    });
    
    if (!playlist) throw new Error('NOT_FOUND');
    return await playlist.destroy();
  }

  async getUserPlaylists(userId) {
    return await Playlist.findAll({
      where: { creatorId: userId },
      attributes: ['id', 'title'],
      order: [['createdAt', 'DESC']]
    });
  }

  async addTrackToPlaylist(playlistId, userId, trackId) {
    const playlist = await Playlist.findOne({ where: { id: playlistId, creatorId: userId } });
    if (!playlist) throw new Error('NOT_FOUND');
    
    await playlist.addTrack(trackId);
    return true;
  }
}

module.exports = new PlaylistService();
