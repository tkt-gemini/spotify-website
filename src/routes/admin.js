const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// GET /admin
router.get('/', async (req, res) => {
  const [
    totalUsers,
    totalArtists,
    totalTracks,
    publishedTracks,
    totalPodcasts,
    publishedEpisodes,
    totalPlaybackEvents
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.track.count(),
    prisma.track.count({ where: { status: 'PUBLISHED' } }),
    prisma.podcastShow.count(),
    prisma.podcastEpisode.count({ where: { status: 'PUBLISHED' } }),
    prisma.playbackEvent.count()
  ]);

  res.render('pages/admin/dashboard', {
    layout: 'layouts/admin-dashboard',
    activeTab: 'dashboard',
    stats: {
      totalUsers,
      totalArtists,
      totalTracks,
      publishedTracks,
      totalPodcasts,
      publishedEpisodes,
      totalPlaybackEvents
    }
  });
});

// GET /admin/users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  const error = req.query.error;

  res.render('pages/admin/users', {
    layout: 'layouts/admin-dashboard',
    activeTab: 'users',
    users,
    error
  });
});

// POST /admin/users/:userId/default-role
router.post('/users/:userId/default-role', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { newRole } = req.body;

  const validRoles = ['USER', 'ARTIST', 'PODCASTER', 'ADMIN'];
  if (!validRoles.includes(newRole)) {
    return res.redirect('/admin/users?error=Invalid role');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.redirect('/admin/users?error=User not found');

  // Prevent demoting the last admin
  if (user.defaultRole === 'ADMIN' && newRole !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { defaultRole: 'ADMIN' } });
    if (adminCount <= 1) {
      return res.redirect('/admin/users?error=Cannot demote the last remaining admin');
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { defaultRole: newRole }
  });

  res.redirect('/admin/users');
});

// POST /admin/users/:userId/plan
router.post('/users/:userId/plan', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { newPlan } = req.body;

  const validPlans = ['FREE', 'PREMIUM'];
  if (!validPlans.includes(newPlan)) {
    return res.redirect('/admin/users?error=Invalid plan');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.redirect('/admin/users?error=User not found');

  await prisma.user.update({
    where: { id: userId },
    data: { plan: newPlan }
  });

  res.redirect('/admin/users');
});

// POST /admin/users/:userId/status
router.post('/users/:userId/status', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { newStatus } = req.body;

  const validStatuses = ['ACTIVE', 'DISABLED'];
  if (!validStatuses.includes(newStatus)) {
    return res.redirect('/admin/users?error=Invalid status');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.redirect('/admin/users?error=User not found');

  // Prevent disabling the last active admin
  if (user.defaultRole === 'ADMIN' && newStatus === 'DISABLED') {
    const activeAdminCount = await prisma.user.count({ 
      where: { 
        defaultRole: 'ADMIN',
        status: 'ACTIVE'
      } 
    });
    if (activeAdminCount <= 1 && user.status === 'ACTIVE') {
      return res.redirect('/admin/users?error=Cannot disable the last active admin');
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  });

  res.redirect('/admin/users');
});

// GET /admin/tracks
router.get('/tracks', async (req, res) => {
  const tracks = await prisma.track.findMany({
    include: { artist: true },
    orderBy: { createdAt: 'desc' }
  });
  
  const error = req.query.error;

  res.render('pages/admin/tracks', {
    layout: 'layouts/admin-dashboard',
    activeTab: 'tracks',
    tracks,
    error
  });
});

// POST /admin/tracks/:trackId/status
router.post('/tracks/:trackId/status', async (req, res) => {
  const trackId = parseInt(req.params.trackId, 10);
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'REMOVED'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/admin/tracks?error=Invalid status');
  }

  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) return res.redirect('/admin/tracks?error=Track not found');

  if (status === 'PUBLISHED' && !track.audioUrl) {
    return res.redirect('/admin/tracks?error=Cannot publish a track without an audioUrl');
  }

  await prisma.track.update({
    where: { id: trackId },
    data: { status }
  });

  res.redirect('/admin/tracks');
});

// GET /admin/podcasts
router.get('/podcasts', async (req, res) => {
  const [shows, episodes] = await Promise.all([
    prisma.podcastShow.findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.podcastEpisode.findMany({
      include: { show: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const error = req.query.error;

  res.render('pages/admin/podcasts', {
    layout: 'layouts/admin-dashboard',
    activeTab: 'podcasts',
    shows,
    episodes,
    error
  });
});

// POST /admin/podcasts/:showId/status
router.post('/podcasts/:showId/status', async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'REMOVED'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/admin/podcasts?error=Invalid status');
  }

  await prisma.podcastShow.update({
    where: { id: showId },
    data: { status }
  });

  res.redirect('/admin/podcasts');
});

// POST /admin/episodes/:episodeId/status
router.post('/episodes/:episodeId/status', async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const { status } = req.body;

  const validStatuses = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'REMOVED'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/admin/podcasts?error=Invalid status');
  }

  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
  if (!episode) return res.redirect('/admin/podcasts?error=Episode not found');

  if (status === 'PUBLISHED' && !episode.audioUrl) {
    return res.redirect('/admin/podcasts?error=Cannot publish an episode without an audioUrl');
  }

  let updateData = { status };
  if (status === 'PUBLISHED' && !episode.publishedAt) {
    updateData.publishedAt = new Date();
  }

  await prisma.podcastEpisode.update({
    where: { id: episodeId },
    data: updateData
  });

  res.redirect('/admin/podcasts');
});

module.exports = router;
