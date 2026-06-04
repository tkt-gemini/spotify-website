const crypto = require('crypto');
const path = require('path');
const { User, ArtistProfile, PodcasterProfile, PodcastShow, PodcastEpisode, Track, LibraryItem, PlayHistory, Album } = require('../models');
const { Op } = require('sequelize');

class StudioService {
  // ─── COMMON ────────────────────────────────────────────────────────────────

  /**
   * Returns the studio overview for a user: which roles they hold.
   * Used to render the Studio Home hub.
   */
  async getStudioOverview(userId) {
    const [artistProfile, podcasterProfile] = await Promise.all([
      ArtistProfile.findOne({ where: { userId } }),
      PodcasterProfile.findOne({ where: { userId } })
    ]);

    let podcastShows = [];
    if (podcasterProfile) {
      podcastShows = await PodcastShow.findAll({
        where: { ownerId: userId },
        order: [['createdAt', 'DESC']]
      });
    }

    let artistTracks = [];
    if (artistProfile) {
      artistTracks = await Track.findAll({
        where: { artistId: artistProfile.id },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    }

    return {
      isArtist: !!artistProfile,
      isPodcaster: !!podcasterProfile,
      artistProfile: artistProfile ? artistProfile.toJSON() : null,
      podcastShows: podcastShows.map(s => s.toJSON()),
      artistTracks: artistTracks.map(t => t.toJSON())
    };
  }

  // ─── ARTIST ────────────────────────────────────────────────────────────────

  /**
   * Returns the artist profile of a user, creating one if the user
   * has registered as artist but no profile exists yet.
   */
  async getArtistProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('NOT_FOUND');

    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_ARTIST');

    const tracks = await Track.findAll({
      where: { artistId: profile.id },
      order: [['createdAt', 'DESC']]
    });

    const albums = await Album.findAll({
      where: { artistId: profile.id },
      order: [['releaseDate', 'DESC']]
    });

    // Analytics: Followers (LibraryItem)
    const followersCount = await LibraryItem.count({
      where: { itemType: 'artist', itemId: profile.id }
    });

    // Analytics: Monthly Listeners (PlayHistory)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyListeners = await PlayHistory.count({
      where: {
        artistName: profile.name,
        playedAt: { [Op.gte]: thirtyDaysAgo }
      },
      distinct: true,
      col: 'userId'
    });

    // Analytics: Total Plays
    const totalPlays = await PlayHistory.count({
      where: { artistName: profile.name }
    });

    return { 
      profile: profile.toJSON(), 
      tracks: tracks.map(t => t.toJSON()),
      albums: albums.map(a => a.toJSON()),
      stats: { followersCount, monthlyListeners, totalPlays }
    };
  }

  /**
   * Updates the artist profile (bio, avatar, coverImage).
   * @param {number} userId
   * @param {{ bio?: string }} data
   * @param {object|null} avatarFile  - multer file object
   * @param {object|null} coverFile   - multer file object
   */
  async updateArtistProfile(userId, data, avatarFile, coverFile) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    if (data.bio !== undefined) {
      // Limit bio length for safety
      profile.bio = String(data.bio).slice(0, 1000);
    }
    if (data.name && String(data.name).trim().length > 0) {
      profile.name = String(data.name).trim().slice(0, 100);
    }
    if (avatarFile) {
      // Use only the basename to avoid path traversal
      profile.avatar = `/uploads/playlists/${path.basename(avatarFile.filename)}`;
    }
    if (coverFile) {
      profile.coverImage = `/uploads/playlists/${path.basename(coverFile.filename)}`;
    }

    await profile.save();
    return profile.toJSON();
  }

  /**
   * Creates a new track for an artist.
   */
  async createArtistTrack(userId, data, audioFile) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const title = String(data.title || '').trim();
    if (!title) throw new Error('INVALID_INPUT');

    const audioUrl = audioFile ? `/uploads/tracks/audio/${path.basename(audioFile.filename)}` : null;

    const track = await Track.create({
      id: crypto.randomUUID(),
      title: title.slice(0, 200),
      artist: profile.name,
      artistId: profile.id,
      albumId: data.albumId || null,
      lyrics: data.lyrics || null,
      audio: audioUrl,
      cover: profile.coverImage || profile.avatar, // Default to artist images
      type: data.type || 'song',
      duration_ms: 0,
      playCount: 0
    });

    return track.toJSON();
  }

  /**
   * Updates an existing track for an artist (metadata only).
   */
  async updateArtistTrack(trackId, userId, data) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const track = await Track.findOne({ where: { id: trackId, artistId: profile.id } });
    if (!track) throw new Error('NOT_FOUND');

    if (data.title && String(data.title).trim().length > 0) {
      track.title = String(data.title).trim().slice(0, 200);
    }
    
    if (data.albumId !== undefined) track.albumId = data.albumId || null;
    if (data.lyrics !== undefined) track.lyrics = data.lyrics || null;
    if (data.type !== undefined) track.type = data.type || 'song';

    await track.save();
    return track.toJSON();
  }

  /**
   * Creates a new album for an artist.
   */
  async createAlbum(userId, data, coverFile) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const title = String(data.title || '').trim();
    if (!title) throw new Error('INVALID_INPUT');

    const coverUrl = coverFile ? `/uploads/albums/covers/${path.basename(coverFile.filename)}` : null;

    const album = await Album.create({
      id: crypto.randomUUID(),
      title: title.slice(0, 200),
      artistId: profile.id,
      cover: coverUrl,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
      type: data.type || 'album'
    });

    return album.toJSON();
  }

  /**
   * Updates an album.
   */
  async updateAlbum(albumId, userId, data, coverFile) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const album = await Album.findOne({ where: { id: albumId, artistId: profile.id } });
    if (!album) throw new Error('NOT_FOUND');

    if (data.title && String(data.title).trim().length > 0) {
      album.title = String(data.title).trim().slice(0, 200);
    }
    if (data.releaseDate) {
      album.releaseDate = new Date(data.releaseDate);
    }
    if (data.type) {
      album.type = data.type;
    }
    if (coverFile) {
      album.cover = `/uploads/albums/covers/${path.basename(coverFile.filename)}`;
    }

    await album.save();
    return album.toJSON();
  }

  /**
   * Deletes an album.
   */
  async deleteAlbum(albumId, userId) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const album = await Album.findOne({ where: { id: albumId, artistId: profile.id } });
    if (!album) throw new Error('NOT_FOUND');

    // Remove albumId from all tracks that belong to this album
    await Track.update({ albumId: null }, { where: { albumId: album.id } });

    await album.destroy();
    return true;
  }

  /**
   * Deletes a track for an artist.
   */
  async deleteArtistTrack(trackId, userId) {
    const profile = await ArtistProfile.findOne({ where: { userId } });
    if (!profile) throw new Error('NOT_FOUND');

    const track = await Track.findOne({ where: { id: trackId, artistId: profile.id } });
    if (!track) throw new Error('NOT_FOUND');

    await track.destroy();
    return true;
  }

  // ─── CREATOR (PODCAST) ─────────────────────────────────────────────────────

  /**
   * Returns all podcast shows owned by the user, with episode counts.
   */
  async getCreatorShows(userId) {
    const shows = await PodcastShow.findAll({
      where: { ownerId: userId },
      include: [{ model: PodcastEpisode, as: 'episodes', attributes: ['id', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    return shows.map(s => {
      const json = s.toJSON();
      json.episodeCount = json.episodes ? json.episodes.length : 0;
      json.publishedCount = json.episodes
        ? json.episodes.filter(e => e.status === 'published').length
        : 0;
      delete json.episodes;
      return json;
    });
  }

  /**
   * Creates a new PodcastShow. Also auto-creates PodcasterProfile if missing.
   * @param {number} userId
   * @param {{ title, description, category, language, explicit }} data
   * @param {object|null} coverFile - multer file object
   */
  async createShow(userId, data, coverFile) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('NOT_FOUND');

    const title = String(data.title || '').trim();
    if (!title) throw new Error('INVALID_INPUT');

    // Auto-create podcaster profile if needed
    await PodcasterProfile.findOrCreate({
      where: { userId },
      defaults: {
        id: crypto.randomUUID(),
        name: user.name || user.username
      }
    });

    const coverUrl = coverFile
      ? `/uploads/podcasts/covers/${path.basename(coverFile.filename)}`
      : null;

    const show = await PodcastShow.create({
      id: crypto.randomUUID(),
      title: title.slice(0, 200),
      description: String(data.description || '').slice(0, 2000),
      cover: coverUrl,
      category: String(data.category || '').slice(0, 100),
      language: String(data.language || 'en').slice(0, 10),
      explicit: data.explicit === 'true' || data.explicit === true,
      ownerId: userId,
      status: 'active'
    });

    return show.toJSON();
  }

  /**
   * Returns a show's details + episodes. Validates ownership.
   */
  async getShowDetails(showId, userId) {
    const show = await PodcastShow.findOne({
      where: { id: showId, ownerId: userId },
      include: [{
        model: PodcastEpisode,
        as: 'episodes',
        order: [['createdAt', 'DESC']]
      }]
    });
    if (!show) throw new Error('NOT_FOUND');
    
    // Analytics: Followers
    const followersCount = await LibraryItem.count({
      where: { itemType: 'podcast', itemId: showId }
    });

    // Analytics: Monthly Listeners (Find recent plays of any episode in this show)
    const episodeIds = show.episodes.map(ep => ep.id);
    let monthlyListeners = 0;
    if (episodeIds.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      monthlyListeners = await PlayHistory.count({
        where: {
          trackId: { [Op.in]: episodeIds },
          playedAt: { [Op.gte]: thirtyDaysAgo }
        },
        distinct: true,
        col: 'userId'
      });
    }

    return { ...show.toJSON(), stats: { followersCount, monthlyListeners } };
  }

  /**
   * Updates a show. Validates ownership.
   */
  async updateShow(showId, userId, data, coverFile) {
    const show = await PodcastShow.findOne({ where: { id: showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    if (data.title && String(data.title).trim().length > 0) {
      show.title = String(data.title).trim().slice(0, 200);
    }
    if (data.description !== undefined) {
      show.description = String(data.description).slice(0, 2000);
    }
    if (data.category !== undefined) {
      show.category = String(data.category).slice(0, 100);
    }
    if (data.language !== undefined) {
      show.language = String(data.language).slice(0, 10);
    }
    if (data.explicit !== undefined) {
      show.explicit = data.explicit === 'true' || data.explicit === true;
    }
    if (coverFile) {
      show.cover = `/uploads/podcasts/covers/${path.basename(coverFile.filename)}`;
    }

    await show.save();
    return show.toJSON();
  }

  /**
   * Deletes a show and all its episodes. Validates ownership.
   */
  async deleteShow(showId, userId) {
    const show = await PodcastShow.findOne({ where: { id: showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    await PodcastEpisode.destroy({ where: { showId } });
    await show.destroy();
    return true;
  }

  /**
   * Creates a new episode for a show.
   */
  async createEpisode(showId, userId, data, audioFile) {
    // Verify show ownership
    const show = await PodcastShow.findOne({ where: { id: showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    const title = String(data.title || '').trim();
    if (!title) throw new Error('INVALID_INPUT');

    const audioUrl = audioFile
      ? `/uploads/podcasts/audio/${path.basename(audioFile.filename)}`
      : null;

    const status = data.status === 'published' ? 'published' : 'draft';

    const episode = await PodcastEpisode.create({
      id: crypto.randomUUID(),
      showId,
      title: title.slice(0, 200),
      description: String(data.description || '').slice(0, 2000),
      audio: audioUrl,
      explicit: data.explicit === 'true' || data.explicit === true,
      status
    });

    return episode.toJSON();
  }

  /**
   * Updates an episode. Validates ownership via show.
   */
  async updateEpisode(episodeId, userId, data, audioFile) {
    const episode = await PodcastEpisode.findByPk(episodeId);
    if (!episode) throw new Error('NOT_FOUND');

    // Verify ownership through the show
    const show = await PodcastShow.findOne({ where: { id: episode.showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    if (data.title && String(data.title).trim().length > 0) {
      episode.title = String(data.title).trim().slice(0, 200);
    }
    if (data.description !== undefined) {
      episode.description = String(data.description).slice(0, 2000);
    }
    if (data.explicit !== undefined) {
      episode.explicit = data.explicit === 'true' || data.explicit === true;
    }
    if (data.status && ['draft', 'published'].includes(data.status)) {
      episode.status = data.status;
    }
    if (audioFile) {
      episode.audio = `/uploads/podcasts/audio/${path.basename(audioFile.filename)}`;
    }

    await episode.save();
    return episode.toJSON();
  }

  /**
   * Deletes an episode. Validates ownership via show.
   */
  async deleteEpisode(episodeId, userId) {
    const episode = await PodcastEpisode.findByPk(episodeId);
    if (!episode) throw new Error('NOT_FOUND');

    const show = await PodcastShow.findOne({ where: { id: episode.showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    await episode.destroy();
    return true;
  }

  /**
   * Publishes a draft episode.
   */
  async publishEpisode(episodeId, userId) {
    const episode = await PodcastEpisode.findByPk(episodeId);
    if (!episode) throw new Error('NOT_FOUND');

    const show = await PodcastShow.findOne({ where: { id: episode.showId, ownerId: userId } });
    if (!show) throw new Error('NOT_FOUND');

    episode.status = 'published';
    await episode.save();
    return episode.toJSON();
  }
}

module.exports = new StudioService();
