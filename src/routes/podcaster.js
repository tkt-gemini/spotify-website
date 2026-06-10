const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { uploadPodcastShowCover, uploadEpisodeAudio } = require('../middlewares/upload');
const { requirePodcastRoleByShowId, requirePodcastRoleByEpisodeId } = require('../middlewares/auth');
const fs = require('fs');

const removeFiles = (files) => {
  if (!files) return;
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (file && file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error removing file:', file.path);
        });
      }
    });
  } else {
    Object.values(files).flat().forEach(file => {
      if (file && file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error removing file:', file.path);
        });
      }
    });
  }
};

// GET /podcaster/shows
router.get('/shows', async (req, res) => {
  const teamMembers = await prisma.podcastTeamMember.findMany({
    where: { userId: req.session.userId },
    include: { show: true }
  });

  res.render('pages/podcaster/shows', {
    teamMembers,
    layout: 'layouts/user-app'
  });
});

// GET /podcaster/shows/new
router.get('/shows/new', (req, res) => {
  res.render('pages/podcaster/show-form', { layout: 'layouts/user-app', error: null });
});

// POST /podcaster/shows
router.post('/shows', uploadPodcastShowCover.single('cover'), async (req, res) => {
  const { title, description } = req.body;
  
  const renderError = (errorMsg) => {
    removeFiles(req.file ? [req.file] : null);
    res.render('pages/podcaster/show-form', { error: errorMsg, layout: 'layouts/user-app' });
  };

  if (!title || title.trim() === '') {
    return renderError('Show title is required');
  }

  if (req.file && req.file.size > 10 * 1024 * 1024) {
    return renderError('Cover image is too large. Max 10MB.');
  }

  let coverUrl = null;

  try {
    if (req.file) {
      coverUrl = `/uploads/images/covers/${req.file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: req.file.originalname,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          localPath: req.file.path,
          publicUrl: coverUrl,
          type: 'IMAGE'
        }
      });
    }

    const show = await prisma.podcastShow.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        coverUrl,
        ownerId: req.session.userId,
        status: 'PUBLISHED',
        teamMembers: {
          create: {
            userId: req.session.userId,
            role: 'OWNER'
          }
        }
      }
    });

    res.redirect(`/podcaster/shows/${show.id}`);
  } catch (err) {
    console.error(err);
    renderError('Server error while creating show');
  }
});

// GET /podcaster/shows/:showId/edit
router.get('/shows/:showId/edit', requirePodcastRoleByShowId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });

  res.render('pages/podcaster/show-form', {
    show,
    error: null,
    layout: 'layouts/podcaster-dashboard'
  });
});

// POST /podcaster/shows/:showId
router.post('/shows/:showId', requirePodcastRoleByShowId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), uploadPodcastShowCover.single('cover'), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const { title, description } = req.body;
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });

  const renderError = (errorMsg) => {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.render('pages/podcaster/show-form', {
      show: { id: showId, title, description, coverUrl: show.coverUrl },
      error: errorMsg,
      layout: 'layouts/podcaster-dashboard'
    });
  };

  if (!title || title.trim() === '') {
    return renderError('Title is required');
  }

  let coverUrl = show.coverUrl;

  try {
    if (req.file) {
      coverUrl = `/uploads/images/covers/${req.file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: req.file.originalname,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          localPath: req.file.path,
          publicUrl: coverUrl,
          type: 'IMAGE'
        }
      });
    }

    await prisma.podcastShow.update({
      where: { id: showId },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        coverUrl
      }
    });

    res.redirect(`/podcaster/shows/${showId}`);
  } catch (err) {
    console.error(err);
    renderError('Server error while updating show');
  }
});

// GET /podcaster/shows/:showId
router.get('/shows/:showId', requirePodcastRoleByShowId(), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const show = await prisma.podcastShow.findUnique({
    where: { id: showId },
    include: { episodes: { orderBy: { createdAt: 'desc' }, take: 5 } }
  });

  const totalEpisodes = await prisma.podcastEpisode.count({ where: { showId } });
  const publishedEpisodes = await prisma.podcastEpisode.count({ where: { showId, status: 'PUBLISHED' } });

  res.render('pages/podcaster/show-detail', {
    currentShow: show,
    showRole: res.locals.showRole,
    totalEpisodes,
    publishedEpisodes,
    activeTab: 'overview',
    layout: 'layouts/podcaster-dashboard'
  });
});

// GET /podcaster/shows/:showId/episodes
router.get('/shows/:showId/episodes', requirePodcastRoleByShowId(), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const show = await prisma.podcastShow.findUnique({
    where: { id: showId },
    include: { episodes: { orderBy: { createdAt: 'desc' } } }
  });

  res.render('pages/podcaster/episodes', {
    currentShow: show,
    showRole: res.locals.showRole,
    episodes: show.episodes,
    activeTab: 'episodes',
    layout: 'layouts/podcaster-dashboard'
  });
});

// GET /podcaster/shows/:showId/episodes/new
router.get('/shows/:showId/episodes/new', requirePodcastRoleByShowId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });

  res.render('pages/podcaster/episode-form', {
    currentShow: show,
    showRole: res.locals.showRole,
    episode: null,
    error: null,
    activeTab: 'episodes',
    layout: 'layouts/podcaster-dashboard'
  });
});

// GET /podcaster/episodes/:episodeId/edit
router.get('/episodes/:episodeId/edit', requirePodcastRoleByEpisodeId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const showId = req.episodeShowId;
  
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });

  res.render('pages/podcaster/episode-form', {
    currentShow: show,
    showRole: res.locals.showRole,
    episode,
    error: null,
    activeTab: 'episodes',
    layout: 'layouts/podcaster-dashboard'
  });
});

// POST /podcaster/shows/:showId/episodes (Create)
router.post('/shows/:showId/episodes', requirePodcastRoleByShowId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), uploadEpisodeAudio.single('audio'), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const { title, description, action } = req.body;
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });

  const renderError = (errorMsg) => {
    removeFiles(req.file ? [req.file] : null);
    res.render('pages/podcaster/episode-form', {
      currentShow: show,
      showRole: res.locals.showRole,
      episode: null,
      error: errorMsg,
      activeTab: 'episodes',
      layout: 'layouts/podcaster-dashboard'
    });
  };

  if (!title || title.trim() === '') {
    return renderError('Title is required');
  }

  let audioUrl = null;

  try {
    if (req.file) {
      audioUrl = `/uploads/audio/episodes/${req.file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: req.file.originalname,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          localPath: req.file.path,
          publicUrl: audioUrl,
          type: 'AUDIO'
        }
      });
    }

    if (action === 'publish' && !audioUrl) {
      return renderError('Cannot publish episode without an audio file.');
    }

    await prisma.podcastEpisode.create({
      data: {
        showId,
        title: title.trim(),
        description: description ? description.trim() : null,
        audioUrl,
        status: action === 'publish' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: action === 'publish' ? new Date() : null
      }
    });

    res.redirect(`/podcaster/shows/${showId}/episodes`);
  } catch (err) {
    console.error(err);
    renderError('Server error while saving episode');
  }
});

// POST /podcaster/episodes/:episodeId (Edit)
router.post('/episodes/:episodeId', requirePodcastRoleByEpisodeId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), uploadEpisodeAudio.single('audio'), async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const showId = req.episodeShowId;
  const { title, description, action } = req.body;
  
  const show = await prisma.podcastShow.findUnique({ where: { id: showId } });

  const renderError = (errorMsg) => {
    removeFiles(req.file ? [req.file] : null);
    res.render('pages/podcaster/episode-form', {
      currentShow: show,
      showRole: res.locals.showRole,
      episode: { id: episodeId, title, description },
      error: errorMsg,
      activeTab: 'episodes',
      layout: 'layouts/podcaster-dashboard'
    });
  };

  if (!title || title.trim() === '') {
    return renderError('Title is required');
  }

  let audioUrl = undefined;

  try {
    if (req.file) {
      audioUrl = `/uploads/audio/episodes/${req.file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: req.file.originalname,
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          localPath: req.file.path,
          publicUrl: audioUrl,
          type: 'AUDIO'
        }
      });
    }

    const existingEpisode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
    const finalAudioUrl = audioUrl !== undefined ? audioUrl : existingEpisode.audioUrl;

    if (action === 'publish' && !finalAudioUrl) {
      return renderError('Cannot publish episode without an audio file.');
    }

    await prisma.podcastEpisode.update({
      where: { id: episodeId },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        ...(audioUrl && { audioUrl }),
        status: action === 'publish' ? 'PUBLISHED' : 'DRAFT',
        ...(action === 'publish' && { publishedAt: new Date() })
      }
    });

    res.redirect(`/podcaster/shows/${showId}/episodes`);
  } catch (err) {
    console.error(err);
    renderError('Server error while updating episode');
  }
});

// POST /podcaster/episodes/:episodeId/publish
router.post('/episodes/:episodeId/publish', requirePodcastRoleByEpisodeId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const showId = req.episodeShowId;

  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
  if (!episode) return res.status(404).send('Episode not found');

  if (!episode.audioUrl) {
    return res.status(400).send('Cannot publish episode without an audio file');
  }

  await prisma.podcastEpisode.update({
    where: { id: episodeId },
    data: { 
      status: 'PUBLISHED',
      publishedAt: episode.publishedAt || new Date()
    }
  });

  res.redirect(`/podcaster/shows/${showId}/episodes`);
});

// POST /podcaster/episodes/:episodeId/schedule
router.post('/episodes/:episodeId/schedule', requirePodcastRoleByEpisodeId(['OWNER', 'ADMIN', 'PRODUCER', 'EDITOR']), async (req, res) => {
  const episodeId = parseInt(req.params.episodeId, 10);
  const showId = req.episodeShowId;
  const { scheduledAt } = req.body;

  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
  if (!episode) return res.status(404).send('Episode not found');

  if (!episode.audioUrl) {
    return res.status(400).send('Cannot schedule episode without an audio file');
  }

  if (!scheduledAt) {
    return res.status(400).send('Scheduled date is required');
  }

  const scheduleDate = new Date(scheduledAt);
  if (scheduleDate <= new Date()) {
    return res.status(400).send('Scheduled date must be in the future');
  }

  await prisma.podcastEpisode.update({
    where: { id: episodeId },
    data: { 
      status: 'DRAFT',
      scheduledAt: scheduleDate
    }
  });

  res.redirect(`/podcaster/shows/${showId}/episodes`);
});

// GET /podcaster/shows/:showId/analytics
router.get('/shows/:showId/analytics', requirePodcastRoleByShowId(), async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const show = await prisma.podcastShow.findUnique({
    where: { id: showId },
    include: { episodes: true }
  });

  const episodeIds = show.episodes.map(e => e.id);

  const [totalEpisodes, publishedEpisodes, totalPlaybackStarts, totalCompletions] = await Promise.all([
    prisma.podcastEpisode.count({ where: { showId } }),
    prisma.podcastEpisode.count({ where: { showId, status: 'PUBLISHED' } }),
    prisma.playbackEvent.count({
      where: {
        episodeId: { in: episodeIds },
        eventType: 'EPISODE_STARTED'
      }
    }),
    prisma.playbackEvent.count({
      where: {
        episodeId: { in: episodeIds },
        eventType: 'EPISODE_COMPLETED'
      }
    })
  ]);

  const completionRate = totalPlaybackStarts > 0 ? Math.round((totalCompletions / totalPlaybackStarts) * 100) : 0;

  // Top episodes
  const topEpisodesQuery = await prisma.playbackEvent.groupBy({
    by: ['episodeId'],
    where: {
      episodeId: { in: episodeIds },
      eventType: 'EPISODE_STARTED'
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topEpisodes = topEpisodesQuery.map(te => {
    const episode = show.episodes.find(e => e.id === te.episodeId);
    return {
      title: episode ? episode.title : 'Unknown',
      plays: te._count.id
    };
  });

  // Recent events
  const recentEventsRaw = await prisma.playbackEvent.findMany({
    where: {
      episodeId: { in: episodeIds },
      eventType: { in: ['EPISODE_STARTED', 'EPISODE_COMPLETED'] }
    },
    orderBy: { playedAt: 'desc' },
    take: 10,
    include: { user: true }
  });

  const recentEvents = recentEventsRaw.map(ev => {
    const episode = show.episodes.find(e => e.id === ev.episodeId);
    return {
      trackTitle: episode ? episode.title : 'Unknown',
      eventType: ev.eventType,
      playedAt: ev.playedAt,
      user: ev.user ? ev.user.name : 'Guest'
    };
  });

  res.render('pages/podcaster/analytics', {
    currentShow: show,
    showRole: res.locals.showRole,
    stats: {
      totalEpisodes,
      publishedEpisodes,
      totalPlays: totalPlaybackStarts,
      totalCompletions,
      completionRate
    },
    topEpisodes,
    recentEvents,
    activeTab: 'analytics',
    layout: 'layouts/podcaster-dashboard'
  });
});

module.exports = router;
