const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = express.Router();
const prisma = require('../config/prisma');
const { requireAuth, requireGuest } = require('../middlewares/auth');

const ERROR_MESSAGES = {
  invalid_credentials: 'Sai email hoặc mật khẩu.',
  email_exists: 'Email này đã được sử dụng.',
  invalid_input: 'Vui lòng điền đầy đủ và đúng định dạng.',
  password_too_short: 'Mật khẩu phải có ít nhất 6 ký tự.',
  account_disabled: 'Tài khoản của bạn đã bị vô hiệu hóa.'
};

// Public routes
router.get('/', (req, res) => res.render('pages/home'));

router.get('/login', requireGuest, (req, res) => {
  const errorKey = req.query.error;
  const errorMessage = ERROR_MESSAGES[errorKey] || null;
  res.render('pages/auth/login', { errorMessage, layout: 'layouts/auth' });
});

router.post('/login', requireGuest, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.redirect('/login?error=invalid_input');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    if (user.status === 'DISABLED') {
      return res.redirect('/login?error=account_disabled');
    }
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');
      req.session.userId = user.id;
      res.redirect('/app/home');
    });
    return;
  }
  
  res.redirect('/login?error=invalid_credentials');
});

router.get('/register', requireGuest, (req, res) => {
  const errorKey = req.query.error;
  const errorMessage = ERROR_MESSAGES[errorKey] || null;
  res.render('pages/auth/register', { errorMessage, layout: 'layouts/auth' });
});

router.post('/register', requireGuest, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.redirect('/register?error=invalid_input');
  }
  
  if (password.length < 6) {
    return res.redirect('/register?error=password_too_short');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return res.redirect('/register?error=email_exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: passwordHash
    }
  });

  req.session.regenerate((err) => {
    if (err) return res.redirect('/login');
    req.session.userId = newUser.id;
    res.redirect('/app/home');
  });
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/login');
  });
});

// Protected App routes
router.get('/app/home', requireAuth, async (req, res) => {
  const [tracks, artists, playlists, podcasts] = await Promise.all([
    prisma.track.findMany({
      where: { status: 'PUBLISHED' },
      include: { artist: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.artist.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.playlist.findMany({
      where: { isPublic: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.podcastShow.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);
  
  res.render('pages/user/home', { 
    tracks, 
    artists, 
    playlists, 
    podcasts, 
    activeTab: 'home', 
    layout: 'layouts/user-app' 
  });
});

router.get('/app/search', requireAuth, async (req, res) => {
  const { q, type = 'all' } = req.query;
  const userId = req.session.userId;
  
  if (!q || q.trim() === '') {
    return res.render('pages/user/search', { q: '', type, results: null, activeTab: 'search', layout: 'layouts/user-app' });
  }

  const query = q.trim();
  const results = {
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
    podcasts: []
  };

  const likeCondition = { status: 'PUBLISHED' };

  if (type === 'all' || type === 'track') {
    const tracks = await prisma.track.findMany({
      where: { title: { contains: query }, ...likeCondition },
      include: { artist: true, album: true }
    });
    
    if (tracks.length > 0) {
      const liked = await prisma.likedTrack.findMany({
        where: { userId, trackId: { in: tracks.map(t => t.id) } }
      });
      const likedIds = new Set(liked.map(l => l.trackId));
      results.tracks = tracks.map(t => ({ ...t, isLiked: likedIds.has(t.id) }));
    }
  }

  if (type === 'all' || type === 'artist') {
    const artists = await prisma.artist.findMany({
      where: { name: { contains: query }, ...likeCondition }
    });
    
    if (artists.length > 0) {
      const followed = await prisma.followedArtist.findMany({
        where: { userId, artistId: { in: artists.map(a => a.id) } }
      });
      const followedIds = new Set(followed.map(f => f.artistId));
      results.artists = artists.map(a => ({ ...a, isFollowed: followedIds.has(a.id) }));
    }
  }

  if (type === 'all' || type === 'album') {
    results.albums = await prisma.album.findMany({
      where: { title: { contains: query }, ...likeCondition },
      include: { artist: true }
    });
  }

  if (type === 'all' || type === 'playlist') {
    results.playlists = await prisma.playlist.findMany({
      where: { name: { contains: query }, isPublic: true },
      include: { user: true }
    });
  }

  if (type === 'all' || type === 'podcast') {
    results.podcasts = await prisma.podcastShow.findMany({
      where: { title: { contains: query }, ...likeCondition },
      include: { owner: true }
    });
  }

  res.render('pages/user/search', { q: query, type, results, activeTab: 'search', layout: 'layouts/user-app' });
});

router.get('/app/artists/:artistId', requireAuth, async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  if (isNaN(artistId)) return res.redirect('/app/home');

  const artist = await prisma.artist.findUnique({
    where: { id: artistId }
  });

  if (!artist || artist.status !== 'PUBLISHED') {
    return res.redirect('/app/home');
  }

  const [tracks, albums, followRecord] = await Promise.all([
    prisma.track.findMany({
      where: { artistId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.album.findMany({
      where: { artistId, status: 'PUBLISHED' },
      orderBy: { releaseDate: 'desc' }
    }),
    prisma.followedArtist.findUnique({
      where: { userId_artistId: { userId: req.session.userId, artistId } }
    })
  ]);

  res.render('pages/user/artist-detail', {
    artist,
    tracks,
    albums,
    isFollowed: !!followRecord,
    activeTab: 'search',
    layout: 'layouts/user-app'
  });
});

router.get('/app/albums/:albumId', requireAuth, async (req, res) => {
  const albumId = parseInt(req.params.albumId, 10);
  if (isNaN(albumId)) return res.redirect('/app/home');

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: { artist: true }
  });

  if (!album || album.status !== 'PUBLISHED') {
    return res.redirect('/app/home');
  }

  const [tracks, saveRecord] = await Promise.all([
    prisma.track.findMany({
      where: { albumId, status: 'PUBLISHED' },
      orderBy: { trackNumber: 'asc' }
    }),
    prisma.savedAlbum.findUnique({
      where: { userId_albumId: { userId: req.session.userId, albumId } }
    })
  ]);

  res.render('pages/user/album-detail', {
    album,
    tracks,
    isSaved: !!saveRecord,
    activeTab: 'search',
    layout: 'layouts/user-app'
  });
});

router.get('/app/library', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  const [playlists, likedTracks, followedArtists, followedPlaylists, savedAlbums, subscribedShows] = await Promise.all([
    prisma.playlist.findMany({ where: { userId } }),
    prisma.likedTrack.findMany({ where: { userId }, include: { track: { include: { artist: true, album: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.followedArtist.findMany({ where: { userId }, include: { artist: true }, orderBy: { createdAt: 'desc' } }),
    prisma.followedPlaylist.findMany({ where: { userId }, include: { playlist: { include: { user: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.savedAlbum.findMany({ where: { userId }, include: { album: { include: { artist: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.subscribedShow.findMany({ where: { userId }, include: { show: true }, orderBy: { createdAt: 'desc' } })
  ]);

  res.render('pages/user/library', {
    playlists,
    likedTracks,
    followedArtists,
    followedPlaylists,
    savedAlbums,
    subscribedShows,
    activeTab: 'library',
    layout: 'layouts/user-app'
  });
});

// Playlist Routes
router.post('/app/playlists', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const name = `My Playlist #${Math.floor(Math.random() * 10000)}`;
  const playlist = await prisma.playlist.create({
    data: {
      userId,
      name,
      isPublic: false
    }
  });
  res.redirect(`/app/playlists/${playlist.id}`);
});

router.get('/app/playlists/:playlistId', requireAuth, async (req, res) => {
  const playlistId = parseInt(req.params.playlistId, 10);
  if (isNaN(playlistId)) return res.redirect('/app/library');

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      user: true,
      tracks: {
        include: {
          track: {
            include: { artist: true, album: true }
          }
        },
        orderBy: { addedAt: 'asc' }
      }
    }
  });

  if (!playlist) return res.redirect('/app/library');

  const isOwner = playlist.userId === req.session.userId;
  if (!playlist.isPublic && !isOwner) {
    return res.redirect('/app/library');
  }

  // If owner, get published tracks to add
  let availableTracks = [];
  if (isOwner) {
    const existingTrackIds = playlist.tracks.map(pt => pt.trackId);
    availableTracks = await prisma.track.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: existingTrackIds }
      },
      include: { artist: true }
    });
  }

  res.render('pages/user/playlist-detail', {
    playlist,
    isOwner,
    availableTracks,
    activeTab: 'library',
    layout: 'layouts/user-app'
  });
});

// Podcast Routes
router.get('/app/podcasts/:showId', requireAuth, async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  if (isNaN(showId)) return res.redirect('/app/library');

  const show = await prisma.podcastShow.findUnique({
    where: { id: showId },
    include: {
      owner: true,
      episodes: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' }
      }
    }
  });

  if (!show || show.status !== 'PUBLISHED') return res.redirect('/app/library');

  const subscribeRecord = await prisma.subscribedShow.findUnique({
    where: { userId_showId: { userId: req.session.userId, showId } }
  });

  res.render('pages/user/podcast-detail', {
    show,
    isSubscribed: !!subscribeRecord,
    activeTab: 'home',
    layout: 'layouts/user-app'
  });
});

router.get('/app/episodes/:episodeId', requireAuth, async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  if (isNaN(episodeId)) return res.redirect('/app/library');

  const episode = await prisma.podcastEpisode.findUnique({
    where: { id: episodeId, status: 'PUBLISHED' },
    include: { show: true }
  });

  if (!episode || episode.show.status !== 'PUBLISHED') return res.redirect('/app/library');

  res.render('pages/user/episode-detail', {
    episode,
    activeTab: 'home',
    layout: 'layouts/user-app'
  });
});
router.get('/app/profile', requireAuth, (req, res) => {
  res.render('pages/user/profile', {
    activeTab: 'profile',
    error: null,
    success: null,
    layout: 'layouts/user-app'
  });
});

router.post('/app/profile', requireAuth, async (req, res) => {
  const { name, currentPassword, newPassword, confirmPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });

  const renderForm = (error, success = null) => {
    res.render('pages/user/profile', {
      activeTab: 'profile',
      error,
      success,
      layout: 'layouts/user-app'
    });
  };

  if (!name || name.trim() === '') {
    return renderForm('Name is required.');
  }

  const updates = { name: name.trim() };

  // Password change requested
  if (newPassword || currentPassword || confirmPassword) {
    if (!currentPassword) {
      return renderForm('Current password is required to change password.');
    }
    if (!newPassword || newPassword.length < 6) {
      return renderForm('New password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return renderForm('Passwords do not match.');
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return renderForm('Incorrect current password.');
    }
    
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updates
  });
  
  // Update locals
  res.locals.currentUser.name = updates.name;

  renderForm(null, 'Profile updated successfully.');
});


const artistRoutes = require('./artist');
router.use('/artist', requireAuth, artistRoutes);

const podcasterRoutes = require('./podcaster');
router.use('/podcaster', requireAuth, podcasterRoutes);

const { requireAdmin } = require('../middlewares/auth');
const adminRoutes = require('./admin');
router.use('/admin', requireAuth, requireAdmin, adminRoutes);

// API Routes
router.post('/api/v1/playback/start', requireAuth, async (req, res) => {
  const { entityType, entityId } = req.body;
  
  if (entityType !== 'track' && entityType !== 'episode') {
    return res.status(400).json({ success: false, error: 'Unsupported entity type' });
  }

  const id = parseInt(entityId, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  const playbackSessionId = crypto.randomUUID();

  if (entityType === 'track') {
    const track = await prisma.track.findUnique({
      where: { id },
      include: { artist: true }
    });

    if (!track) return res.status(404).json({ success: false, error: 'Track not found' });
    if (track.status !== 'PUBLISHED') return res.status(403).json({ success: false, error: 'Track is not available' });
    if (!track.audioUrl) return res.status(400).json({ success: false, error: 'Track has no audio URL' });

    await prisma.playbackEvent.create({
      data: {
        playbackSessionId,
        userId: req.session.userId,
        trackId: track.id,
        eventType: 'TRACK_STARTED'
      }
    });

    return res.json({
      success: true,
      playbackSessionId,
      title: track.title,
      artistName: track.artist.name,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl
    });
  } else if (entityType === 'episode') {
    const episode = await prisma.podcastEpisode.findUnique({
      where: { id },
      include: { show: true }
    });

    if (!episode) return res.status(404).json({ success: false, error: 'Episode not found' });
    if (episode.status !== 'PUBLISHED') return res.status(403).json({ success: false, error: 'Episode is not available' });
    if (!episode.audioUrl) return res.status(400).json({ success: false, error: 'Episode has no audio URL' });

    await prisma.playbackEvent.create({
      data: {
        playbackSessionId,
        userId: req.session.userId,
        episodeId: episode.id,
        eventType: 'EPISODE_STARTED'
      }
    });

    return res.json({
      success: true,
      playbackSessionId,
      title: episode.title,
      artistName: episode.show.title, // subtitle is mapped to artistName in frontend player
      audioUrl: episode.audioUrl,
      coverUrl: episode.show.coverUrl // Use show's cover url per requirements
    });
  }
});

router.post('/api/v1/playback/progress', requireAuth, async (req, res) => {
  const { playbackSessionId, entityType, entityId, positionMs } = req.body;
  if (!playbackSessionId || !entityType || !entityId) {
    return res.status(400).json({ success: false });
  }

  const id = parseInt(entityId, 10);
  if (isNaN(id)) return res.status(400).json({ success: false });

  await prisma.playbackEvent.create({
    data: {
      playbackSessionId,
      userId: req.session.userId,
      trackId: entityType === 'track' ? id : null,
      episodeId: entityType === 'episode' ? id : null,
      eventType: entityType === 'track' ? 'TRACK_PROGRESS' : 'EPISODE_PROGRESS',
      durationMs: positionMs ? parseInt(positionMs, 10) : null
    }
  });

  res.json({ success: true });
});

router.post('/api/v1/playback/complete', requireAuth, async (req, res) => {
  const { playbackSessionId, entityType, entityId } = req.body;
  if (!playbackSessionId || !entityType || !entityId) {
    return res.status(400).json({ success: false });
  }

  const id = parseInt(entityId, 10);
  if (isNaN(id)) return res.status(400).json({ success: false });

  await prisma.playbackEvent.create({
    data: {
      playbackSessionId,
      userId: req.session.userId,
      trackId: entityType === 'track' ? id : null,
      episodeId: entityType === 'episode' ? id : null,
      eventType: entityType === 'track' ? 'TRACK_COMPLETED' : 'EPISODE_COMPLETED'
    }
  });

  res.json({ success: true });
});

// Phase 2 APIs
router.post('/api/v1/me/library/tracks/:trackId', requireAuth, async (req, res) => {
  const trackId = parseInt(req.params.trackId, 10);
  if (isNaN(trackId)) return res.status(400).json({ success: false });
  
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track || track.status !== 'PUBLISHED') return res.status(400).json({ success: false });

  await prisma.likedTrack.upsert({
    where: { userId_trackId: { userId: req.session.userId, trackId } },
    update: {},
    create: { userId: req.session.userId, trackId }
  });
  
  res.json({ success: true });
});

router.delete('/api/v1/me/library/tracks/:trackId', requireAuth, async (req, res) => {
  const trackId = parseInt(req.params.trackId, 10);
  if (isNaN(trackId)) return res.status(400).json({ success: false });
  
  await prisma.likedTrack.deleteMany({
    where: { userId: req.session.userId, trackId }
  });
  
  res.json({ success: true });
});

router.post('/api/v1/me/follow/artists/:artistId', requireAuth, async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  if (isNaN(artistId)) return res.status(400).json({ success: false });
  
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist || artist.status !== 'PUBLISHED') return res.status(400).json({ success: false });

  await prisma.followedArtist.upsert({
    where: { userId_artistId: { userId: req.session.userId, artistId } },
    update: {},
    create: { userId: req.session.userId, artistId }
  });
  
  res.json({ success: true });
});

router.delete('/api/v1/me/follow/artists/:artistId', requireAuth, async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  if (isNaN(artistId)) return res.status(400).json({ success: false });
  
  await prisma.followedArtist.deleteMany({
    where: { userId: req.session.userId, artistId }
  });
  
  res.json({ success: true });
});

router.post('/api/v1/playlists/:playlistId/tracks', requireAuth, async (req, res) => {
  const playlistId = parseInt(req.params.playlistId, 10);
  const { trackId } = req.body;
  const parsedTrackId = parseInt(trackId, 10);
  
  if (isNaN(playlistId) || isNaN(parsedTrackId)) return res.status(400).json({ success: false });

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.userId !== req.session.userId) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  const track = await prisma.track.findUnique({ where: { id: parsedTrackId } });
  if (!track || track.status !== 'PUBLISHED') return res.status(400).json({ success: false });

  await prisma.playlistTrack.upsert({
    where: { playlistId_trackId: { playlistId, trackId: parsedTrackId } },
    update: {},
    create: { playlistId, trackId: parsedTrackId }
  });

  res.json({ success: true });
});

router.delete('/api/v1/playlists/:playlistId/tracks/:playlistTrackId', requireAuth, async (req, res) => {
  const playlistId = parseInt(req.params.playlistId, 10);
  const playlistTrackId = parseInt(req.params.playlistTrackId, 10);
  
  if (isNaN(playlistId) || isNaN(playlistTrackId)) return res.status(400).json({ success: false });

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.userId !== req.session.userId) {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  // Ensure this playlistTrack actually belongs to this playlist before deleting
  await prisma.playlistTrack.deleteMany({
    where: {
      id: playlistTrackId,
      playlistId
    }
  });

  res.json({ success: true });
});

router.post('/api/v1/me/library/albums/:albumId', requireAuth, async (req, res) => {
  const albumId = parseInt(req.params.albumId, 10);
  if (isNaN(albumId)) return res.status(400).json({ success: false });
  
  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.status !== 'PUBLISHED') return res.status(400).json({ success: false });

  await prisma.savedAlbum.upsert({
    where: { userId_albumId: { userId: req.session.userId, albumId } },
    update: {},
    create: { userId: req.session.userId, albumId }
  });
  
  res.json({ success: true });
});

router.delete('/api/v1/me/library/albums/:albumId', requireAuth, async (req, res) => {
  const albumId = parseInt(req.params.albumId, 10);
  if (isNaN(albumId)) return res.status(400).json({ success: false });
  
  await prisma.savedAlbum.deleteMany({
    where: { userId: req.session.userId, albumId }
  });
  
  res.json({ success: true });
});

router.post('/api/v1/me/subscribe/shows/:showId', requireAuth, async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  if (isNaN(showId)) return res.status(400).json({ success: false });
  
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });
  if (!show || show.status !== 'PUBLISHED') return res.status(400).json({ success: false });

  await prisma.subscribedShow.upsert({
    where: { userId_showId: { userId: req.session.userId, showId } },
    update: {},
    create: { userId: req.session.userId, showId }
  });
  
  res.json({ success: true });
});

router.delete('/api/v1/me/subscribe/shows/:showId', requireAuth, async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  if (isNaN(showId)) return res.status(400).json({ success: false });
  
  await prisma.subscribedShow.deleteMany({
    where: { userId: req.session.userId, showId }
  });
  
  res.json({ success: true });
});

module.exports = router;
