var express = require('express');
var router = express.Router();

const { Playlist, Track, User, ArtistProfile, PodcasterProfile, LibraryItem, PodcastShow, PodcastEpisode, PlayHistory } = require('../models');
const { Op } = require('sequelize');
const LibraryService = require('../services/LibraryService');
const RecommendationService = require('../services/RecommendationService');

// Helper to render pages seamlessly
async function renderPage(req, res, page, title, extraData = {}) {
  const data = { title, user: req.session.user, ...extraData };
  
  if (req.query.ajax === '1' || req.xhr) {
    res.render(`pages/${page}`, data);
  } else {
    // Only fetch global sidebar data for full page loads
    if (!data.playlists && req.session.user) {
      data.playlists = await LibraryService.getSidebarItems(req.session.user.id);
    }
    
    res.render('layout', { page: `pages/${page}`, ...data });
  }
}

router.get('/search', async function(req, res, next) {
  try {
    const q = req.query.q || '';
    let searchResults = { artists: [], tracks: [], playlists: [] };
    
    if (q.trim().length > 0) {
      const searchPattern = `%${q}%`;
      
      searchResults.artists = await ArtistProfile.findAll({
        where: { name: { [Op.like]: searchPattern } },
        include: [{ model: User, as: 'user', attributes: ['avatar'] }],
        limit: 10
      });
      
      searchResults.tracks = await Track.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: searchPattern } },
            { artist: { [Op.like]: searchPattern } }
          ],
          type: 'song' // ensure only songs
        },
        limit: 10
      });
      
      searchResults.podcasts = await PodcastShow.findAll({
        where: { title: { [Op.like]: searchPattern } },
        limit: 5,
        include: [{ 
          model: User, 
          as: 'owner', 
          attributes: ['name'],
          include: [{ model: PodcasterProfile, as: 'podcasterProfile' }]
        }]
      });
      
      searchResults.playlists = await Playlist.findAll({
        where: { title: { [Op.like]: searchPattern } },
        limit: 5,
        include: [{ model: User, as: 'creator', attributes: ['name', 'username'] }]
      });
    }

    await renderPage(req, res, 'search', 'Spotify - Search', { q, searchResults });
  } catch (error) {
    next(error);
  }
});

router.get('/playlist/:id', async function(req, res, next) {
  try {
    const playlistId = req.params.id;
    const playlist = await Playlist.findOne({
      where: { id: playlistId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'username', 'avatar'] },
        { model: Track, as: 'tracks' }
      ]
    });
    
    if (!playlist) {
      return res.status(404).send('Playlist not found');
    }
    
    let isSaved = false;
    let userFolders = [];
    if (req.session && req.session.user) {
      if (playlist.creatorId !== req.session.user.id) {
        isSaved = await LibraryService.checkItem(req.session.user.id, playlist.id, 'playlist');
      }
      userFolders = await Playlist.findAll({
        where: { creatorId: req.session.user.id, isFolder: true },
        attributes: ['id', 'title']
      });
    }
    
    // Sort tracks if needed, or rely on PlaylistTracks order
    await renderPage(req, res, 'playlist', `${playlist.title} - Spotify`, { playlist, isSaved, userFolders });
  } catch (err) {
    next(err);
  }
});

router.get('/podcast/:id', async function(req, res, next) {
  try {
    const showId = req.params.id;
    const podcastShow = await PodcastShow.findOne({
      where: { id: showId },
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['name', 'username'],
          include: [{ model: PodcasterProfile, as: 'podcasterProfile' }]
        },
        { model: PodcastEpisode, as: 'episodes' }
      ]
    });
    
    if (!podcastShow) {
      return res.status(404).send('Podcast Show not found');
    }
    let isFollowing = false;
    let savedEpisodes = [];
    if (req.session && req.session.user) {
      isFollowing = await LibraryService.checkItem(req.session.user.id, podcastShow.id, 'podcast');
      // get saved episodes from LibraryItem directly or through a new method
      const savedEps = await LibraryService.getSavedEpisodes(req.session.user.id);
      savedEpisodes = savedEps;
    }
    
    await renderPage(req, res, 'podcast', `${podcastShow.title} - Spotify`, { podcastShow, isFollowing, savedEpisodes });
  } catch (err) {
    next(err);
  }
});

// API route to get artist info dynamically for the right sidebar
router.get('/api/artist/:name', async function(req, res, next) {
  try {
    const artistName = req.params.name;
    const artistProfile = await ArtistProfile.findOne({
      where: { name: artistName }
    });

    if (artistProfile) {
      return res.json({ success: true, data: artistProfile });
    }

    // If not found in ArtistProfile, might be a PodcasterProfile
    const podcasterProfile = await PodcasterProfile.findOne({
      where: { name: artistName }
    });

    if (podcasterProfile) {
      return res.json({ success: true, data: podcasterProfile });
    }

    // If still not found, it might be a Podcast Show title passed as the artist name
    const podcastShow = await PodcastShow.findOne({
      where: { title: artistName }
    });

    if (podcastShow) {
      return res.json({ 
        success: true, 
        data: { 
          name: podcastShow.title, 
          bio: podcastShow.description, 
          avatar: podcastShow.cover 
        } 
      });
    }

    return res.status(404).json({ success: false, message: 'Not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/artist/:name', async function(req, res, next) {
  try {
    const artistName = req.params.name;
    const artistUser = await ArtistProfile.findOne({
      where: { name: artistName },
      include: [{ model: User, as: 'user', attributes: ['avatar'] }]
    });
    
    if (!artistUser) {
      return res.status(404).send('Artist not found');
    }
    
    // Fetch popular tracks for this artist
    const popularTracks = await Track.findAll({
      where: { artist: artistName },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const followersCount = await LibraryItem.count({
      where: { itemType: 'artist', itemId: artistUser.id }
    });

    let isFollowing = false;
    if (req.session && req.session.user) {
      isFollowing = await LibraryService.checkItem(req.session.user.id, artistUser.id, 'artist');
    }
    
    await renderPage(req, res, 'artist', `${artistName} - Spotify`, { artistUser, popularTracks, isFollowing, followersCount });
  } catch (err) {
    next(err);
  }
});

router.get('/podcaster/:name', async function(req, res, next) {
  try {
    const podcasterName = req.params.name;
    const podcasterUser = await PodcasterProfile.findOne({
      where: { name: podcasterName },
      include: [{ model: User, as: 'user', attributes: ['avatar'] }]
    });
    
    if (!podcasterUser) {
      return res.status(404).send('Podcaster not found');
    }
    
    // For now we reuse the artist page, but pass podcaster info
    await renderPage(req, res, 'artist', `${podcasterName} - Spotify`, { artistUser: podcasterUser, popularTracks: [] });
  } catch (err) {
    next(err);
  }
});

// Profile route
router.get('/profile', async function(req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    // Fetch the user's created public playlists to display on their profile
    const userPlaylists = await Playlist.findAll({
      where: { creatorId: req.session.user.id, isPublic: true },
      order: [['createdAt', 'DESC']]
    });
    // Fetch followed items
    const libraryItems = await LibraryItem.findAll({ where: { userId: req.session.user.id } });
    
    const followedArtistIds = libraryItems.filter(i => i.itemType === 'artist').map(i => i.itemId);
    const followedArtists = followedArtistIds.length > 0 ? await ArtistProfile.findAll({
      where: { id: followedArtistIds },
      include: [{ model: User, as: 'user', attributes: ['avatar'] }]
    }) : [];
    
    const followedPodcastIds = libraryItems.filter(i => i.itemType === 'podcast').map(i => i.itemId);
    const followedPodcasts = followedPodcastIds.length > 0 ? await PodcastShow.findAll({
      where: { id: followedPodcastIds },
      include: [{ model: User, as: 'owner', attributes: ['name'], include: [{ model: PodcasterProfile, as: 'podcasterProfile' }] }]
    }) : [];
    
    await renderPage(req, res, 'profile', 'Profile', { 
      userPlaylists, 
      profileUser: req.session.user, 
      isOwnProfile: true,
      followedArtists,
      followedPodcasts
    });
  } catch (err) {
    next(err);
  }
});

// View other user's profile
router.get('/user/:id', async function(req, res, next) {
  try {
    const targetUserId = req.params.id;
    const profileUser = await User.findByPk(targetUserId, {
      attributes: ['id', 'name', 'username', 'avatar']
    });
    
    if (!profileUser) {
      return res.status(404).send('User not found');
    }

    const isOwnProfile = req.session.user && req.session.user.id === profileUser.id;

    // Fetch the user's created public playlists to display on their profile
    const userPlaylists = await Playlist.findAll({
      where: { creatorId: profileUser.id, isPublic: true },
      order: [['createdAt', 'DESC']]
    });
    // Fetch followed items
    const libraryItems = await LibraryItem.findAll({ where: { userId: profileUser.id } });
    
    const followedArtistIds = libraryItems.filter(i => i.itemType === 'artist').map(i => i.itemId);
    const followedArtists = followedArtistIds.length > 0 ? await ArtistProfile.findAll({
      where: { id: followedArtistIds },
      include: [{ model: User, as: 'user', attributes: ['avatar'] }]
    }) : [];
    
    const followedPodcastIds = libraryItems.filter(i => i.itemType === 'podcast').map(i => i.itemId);
    const followedPodcasts = followedPodcastIds.length > 0 ? await PodcastShow.findAll({
      where: { id: followedPodcastIds },
      include: [{ model: User, as: 'owner', attributes: ['name'], include: [{ model: PodcasterProfile, as: 'podcasterProfile' }] }]
    }) : [];
    
    await renderPage(req, res, 'profile', `${profileUser.name} - Profile`, { 
      userPlaylists, 
      profileUser, 
      isOwnProfile,
      followedArtists,
      followedPodcasts
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async function(req, res, next) {
  try {
    let playlists = [];
    let libraryItems = [];
    let enhancedUser = null;
    
    if (req.session.user) {
      enhancedUser = { ...req.session.user };
      const artistProfile = await ArtistProfile.findOne({ where: { userId: req.session.user.id } });
      const podcasterProfile = await PodcasterProfile.findOne({ where: { userId: req.session.user.id } });
      
      enhancedUser.isArtist = !!artistProfile;
      enhancedUser.isPodcaster = !!podcasterProfile;
      
      playlists = await LibraryService.getSidebarItems(req.session.user.id);
    }
    
    // Fetch recently played tracks
    let recentTracks = [];
    if (req.session.user) {
      const recentPlays = await PlayHistory.findAll({
        where: { userId: req.session.user.id },
        order: [['playedAt', 'DESC']],
        limit: 20
      });
      
      const trackIds = [...new Set(recentPlays.map(p => p.trackId))].slice(0, 8); // top 8 unique recent tracks
      if (trackIds.length > 0) {
        const foundTracks = await Track.findAll({ where: { id: trackIds } });
        // Restore order
        const trackMap = {};
        foundTracks.forEach(t => trackMap[t.id] = t);
        recentTracks = trackIds.map(id => trackMap[id]).filter(Boolean);
      }
    }
    
    // Fetch all tracks of type song
    const allTracks = await Track.findAll({
      where: { type: 'song' },
      order: [['createdAt', 'DESC']]
    });
    
    // Fetch all tracks of type podcast (now from PodcastShow)
    const allPodcasts = await PodcastShow.findAll({
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['name'],
          include: [{ model: PodcasterProfile, as: 'podcasterProfile' }]
        },
        { 
          model: PodcastEpisode, 
          as: 'episodes',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Fetch all artists
    let allArtists = await ArtistProfile.findAll({
      include: [{ model: User, as: 'user', attributes: ['avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    // Exclude the current user from the artists list
    if (req.session.user) {
      allArtists = allArtists.filter(artist => artist.userId !== req.session.user.id);
    }

    // Fetch all public playlists, excluding the user's own playlists, for the Recommended section
    let playlistWhereClause = { isPublic: true };
    if (req.session.user) {
      playlistWhereClause = {
        isPublic: true,
        creatorId: { [Op.ne]: req.session.user.id }
      };
    }
    
    const publicPlaylists = await Playlist.findAll({
      where: playlistWhereClause,
      include: [{ model: User, as: 'creator', attributes: ['name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });

    const currentFacet = req.query.facet || 'all';

    // Get personalized recommendations
    const recommendedTracks = await RecommendationService.getRecommendedTracks(
      req.session.user ? req.session.user.id : null
    );

    await renderPage(req, res, 'home', 'Home', { 
      playlists, 
      libraryItems, 
      allTracks, 
      allPodcasts, 
      allArtists, 
      publicPlaylists,
      recentTracks,
      recommendedTracks,
      user: enhancedUser || req.session.user,
      currentFacet
    });
  } catch (err) {
    next(err);
  }
});


// ── STUDIO ROUTES ────────────────────────────────────────────────────────────

// GET /studio — Studio Hub
router.get('/studio', async function(req, res, next) {
  try {
    const StudioService = require('../services/StudioService');
    const overview = await StudioService.getStudioOverview(req.session.user.id);
    await renderPage(req, res, 'studio', 'Your Studio', { overview });
  } catch (err) {
    next(err);
  }
});

// GET /studio/creator — Creator Dashboard (podcast shows)
router.get('/studio/creator', async function(req, res, next) {
  try {
    const StudioService = require('../services/StudioService');
    const shows = await StudioService.getCreatorShows(req.session.user.id);
    const { ArtistProfile, PodcasterProfile } = require('../models');
    const isPodcaster = !!(await PodcasterProfile.findOne({ where: { userId: req.session.user.id } }));
    await renderPage(req, res, 'studio-creator', 'Creator Studio', { shows, isPodcaster });
  } catch (err) {
    next(err);
  }
});

// GET /studio/artist — Artist Dashboard
router.get('/studio/artist', async function(req, res, next) {
  try {
    const StudioService = require('../services/StudioService');
    try {
      const data = await StudioService.getArtistProfile(req.session.user.id);
      await renderPage(req, res, 'studio-artist', 'Artist Studio', data);
    } catch (e) {
      if (e.message === 'NOT_ARTIST') {
        await renderPage(req, res, 'studio-artist', 'Artist Studio', { profile: null, tracks: [] });
      } else throw e;
    }
  } catch (err) {
    next(err);
  }
});

// GET /studio/creator/show/:id — Show Detail Dashboard
router.get('/studio/creator/show/:id', async function(req, res, next) {
  try {
    const StudioService = require('../services/StudioService');
    const show = await StudioService.getShowDetails(req.params.id, req.session.user.id);
    await renderPage(req, res, 'studio-creator', 'Creator Studio', { show, shows: [], isPodcaster: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).send('Show not found');
    next(err);
  }
});

// GET /collection/tracks — Liked Songs
router.get('/collection/tracks', async function(req, res, next) {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    
    // Fetch liked tracks from library
    const libraryItems = await LibraryItem.findAll({
      where: { userId: req.session.user.id, itemType: 'track' },
      order: [['createdAt', 'DESC']]
    });
    
    const trackIds = libraryItems.map(item => item.itemId);
    
    let tracks = [];
    if (trackIds.length > 0) {
      tracks = await Track.findAll({
        where: { id: trackIds }
      });
      
      // Preserve order from libraryItems (most recently liked first)
      const trackMap = {};
      tracks.forEach(t => trackMap[t.id] = t);
      tracks = trackIds.map(id => trackMap[id]).filter(Boolean);
    }
    
    await renderPage(req, res, 'collection-tracks', 'Liked Songs', { tracks, libraryItems });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

