const { Playlist, User, LibraryItem } = require('../models');

class LibraryService {
  /**
   * Retrieves all playlists and library items for a user, formatted for the sidebar.
   * @param {number} userId - The ID of the user
   * @returns {Promise<Array>} - Sorted array of sidebar items
   */
  static async getSidebarItems(userId) {
    try {
      const rawPlaylists = await Playlist.findAll({
        where: { creatorId: userId },
        include: [{ model: User, as: 'creator', attributes: ['name', 'username'] }],
        order: [['createdAt', 'ASC']]
      });
      
      const rawLibrary = await LibraryItem.findAll({
        where: { userId: userId },
        order: [['createdAt', 'ASC']]
      });
      
      let combined = [];
      rawPlaylists.forEach(p => combined.push({ ...p.toJSON(), sidebarType: 'playlist' }));
      
      const { ArtistProfile, Playlist: MPlaylist, PodcastShow } = require('../models');
      
      for (const l of rawLibrary) {
        if (l.itemType === 'playlist') {
          const p = await MPlaylist.findOne({
            where: { id: l.itemId },
            include: [{ model: User, as: 'creator', attributes: ['name', 'username'] }]
          });
          if (p) {
            let pJSON = p.toJSON();
            pJSON.sidebarType = 'playlist';
            pJSON.itemId = l.itemId;
            pJSON.createdAt = l.createdAt;
            combined.push(pJSON);
          }
        } else if (l.itemType === 'artist') {
          const a = await ArtistProfile.findOne({
            where: { id: l.itemId },
            include: [{ model: User, as: 'user', attributes: ['avatar'] }]
          });
          if (a) {
            let aJSON = a.toJSON();
            aJSON.title = aJSON.name;
            aJSON.sidebarType = 'artist';
            aJSON.itemId = l.itemId;
            aJSON.createdAt = l.createdAt;

            combined.push(aJSON);
          } else {

          }
        } else if (l.itemType === 'podcast') {
          const p = await PodcastShow.findOne({
            where: { id: l.itemId }
          });
          if (p) {
            let pJSON = p.toJSON();
            pJSON.sidebarType = 'podcast';
            pJSON.itemId = l.itemId;
            pJSON.createdAt = l.createdAt;
            combined.push(pJSON);
          }
        }
      }
      
      combined.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return combined;
    } catch (err) {
      console.error("LibraryService: Failed to load sidebar items", err);
      return [];
    }
  }

  static async checkItem(userId, itemId, itemType) {
    const item = await LibraryItem.findOne({ 
      where: { itemId, itemType, userId } 
    });
    return !!item;
  }

  static async toggleArtist(userId, artistName) {
    const { ArtistProfile } = require('../models');
    
    const targetProfile = await ArtistProfile.findOne({ where: { name: artistName } });
    if (!targetProfile) throw new Error('NOT_FOUND');

    const existing = await LibraryItem.findOne({
      where: { userId, itemType: 'artist', itemId: targetProfile.id }
    });

    if (existing) {
      await existing.destroy();
      return false;
    } else {
      await LibraryItem.create({
        userId,
        itemType: 'artist',
        itemId: targetProfile.id
      });
      return true;
    }
  }

  static async togglePlaylist(userId, playlistId) {
    const existing = await LibraryItem.findOne({
      where: { userId, itemType: 'playlist', itemId: playlistId }
    });

    if (existing) {
      await existing.destroy();
      return false;
    } else {
      await LibraryItem.create({
        userId,
        itemType: 'playlist',
        itemId: playlistId
      });
      return true;
    }
  }

  static async toggleTrack(userId, trackId) {
    const existing = await LibraryItem.findOne({
      where: { userId, itemType: 'track', itemId: trackId }
    });

    if (existing) {
      await existing.destroy();
      return false;
    } else {
      await LibraryItem.create({
        userId,
        itemType: 'track',
        itemId: trackId
      });
      return true;
    }
  }

  static async togglePodcast(userId, podcastId) {
    const existing = await LibraryItem.findOne({
      where: { userId, itemType: 'podcast', itemId: podcastId }
    });

    if (existing) {
      await existing.destroy();
      return false;
    } else {
      await LibraryItem.create({
        userId,
        itemType: 'podcast',
        itemId: podcastId
      });
      return true;
    }
  }

  static async toggleEpisode(userId, episodeId) {
    const existing = await LibraryItem.findOne({
      where: { userId, itemType: 'episode', itemId: episodeId }
    });

    if (existing) {
      await existing.destroy();
      return false;
    } else {
      await LibraryItem.create({
        userId,
        itemType: 'episode',
        itemId: episodeId
      });
      return true;
    }
  }

  static async getSavedEpisodes(userId) {
    const items = await LibraryItem.findAll({
      where: { userId, itemType: 'episode' }
    });
    return items.map(i => i.itemId);
  }
}

module.exports = LibraryService;
