var express = require('express');
var router = express.Router();
const { User, Track, Playlist, ArtistProfile, PodcasterProfile } = require('../models');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(403).send('Forbidden: Admin access only');
  }
  next();
};

// Render admin dashboard
router.get('/', requireAdmin, async (req, res) => {
  res.render('layout', {
    page: 'pages/admin',
    title: 'Admin Dashboard - Spotify',
    user: req.session.user
  });
});

// GET /api/stats
router.get('/api/stats', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTracks = await Track.count();
    const totalPlaylists = await Playlist.count();
    res.json({ success: true, stats: { totalUsers, totalTracks, totalPlaylists } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users
router.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'email', 'isAdmin', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Check artist/podcaster roles
    const artists = await ArtistProfile.findAll();
    const podcasters = await PodcasterProfile.findAll();
    
    const artistUserIds = new Set(artists.map(a => a.userId));
    const podcasterUserIds = new Set(podcasters.map(p => p.userId));
    
    const userData = users.map(u => {
      const plain = u.get({ plain: true });
      plain.isArtist = artistUserIds.has(plain.id);
      plain.isPodcaster = podcasterUserIds.has(plain.id);
      return plain;
    });
    
    res.json({ success: true, users: userData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id/role
router.put('/api/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role, value } = req.body;
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role === 'isAdmin') {
      user.isAdmin = value;
      await user.save();
    } else if (role === 'isArtist') {
      if (value) {
        await ArtistProfile.findOrCreate({ where: { userId, name: user.name } });
      } else {
        await ArtistProfile.destroy({ where: { userId } });
      }
    } else if (role === 'isPodcaster') {
      if (value) {
        await PodcasterProfile.findOrCreate({ where: { userId, name: user.name } });
      } else {
        await PodcasterProfile.destroy({ where: { userId } });
      }
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Also cleanup profiles
    await ArtistProfile.destroy({ where: { userId: user.id } });
    await PodcasterProfile.destroy({ where: { userId: user.id } });
    
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tracks
router.get('/api/tracks', requireAdmin, async (req, res) => {
  try {
    const tracks = await Track.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, tracks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tracks/:id
router.delete('/api/tracks/:id', requireAdmin, async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    
    await track.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
