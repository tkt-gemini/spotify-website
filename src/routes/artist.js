const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const upload = require('../middlewares/upload');
const { requireArtistRole } = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');

// Helper to remove files on error
const removeFiles = (files) => {
  if (!files) return;
  Object.values(files).flat().forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error removing file:', file.path);
      });
    }
  });
};

// GET /artist/select
router.get('/select', async (req, res) => {
  const teamMembers = await prisma.artistTeamMember.findMany({
    where: { userId: req.session.userId },
    include: { artist: true }
  });

  res.render('pages/artist/select', {
    teamMembers,
    layout: 'layouts/user-app'
  });
});

// GET /artist/new
router.get('/new', (req, res) => {
  res.render('pages/artist/create', { layout: 'layouts/user-app' });
});

// POST /artist
router.post('/', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  const { name, bio } = req.body;
  if (!name || name.trim() === '') {
    removeFiles(req.files);
    return res.render('pages/artist/create', { error: 'Artist name is required', layout: 'layouts/user-app' });
  }

  // Check image size limits (10MB)
  let imageTooLarge = false;
  if (req.files) {
    Object.values(req.files).flat().forEach(file => {
      if (file.size > 10 * 1024 * 1024) imageTooLarge = true;
    });
  }

  if (imageTooLarge) {
    removeFiles(req.files);
    return res.render('pages/artist/create', { error: 'Image file too large. Max 10MB.', layout: 'layouts/user-app' });
  }

  let avatarUrl = null;
  let bannerUrl = null;

  try {
    if (req.files && req.files['avatar']) {
      const file = req.files['avatar'][0];
      avatarUrl = `/uploads/images/avatars/${file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          localPath: file.path,
          publicUrl: avatarUrl,
          type: 'IMAGE'
        }
      });
    }

    if (req.files && req.files['banner']) {
      const file = req.files['banner'][0];
      bannerUrl = `/uploads/images/banners/${file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          localPath: file.path,
          publicUrl: bannerUrl,
          type: 'IMAGE'
        }
      });
    }

    const artist = await prisma.artist.create({
      data: {
        name: name.trim(),
        bio: bio ? bio.trim() : null,
        avatarUrl,
        bannerUrl,
        status: 'PUBLISHED', // per requirement
        createdById: req.session.userId,
        teamMembers: {
          create: {
            userId: req.session.userId,
            role: 'OWNER'
          }
        }
      }
    });

    res.redirect(`/artist/${artist.id}/overview`);
  } catch (err) {
    console.error(err);
    removeFiles(req.files);
    res.render('pages/artist/create', { error: 'Server error while creating artist', layout: 'layouts/user-app' });
  }
});

// GET /artist/:artistId/overview
router.get('/:artistId/overview', requireArtistRole(), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { tracks: { orderBy: { createdAt: 'desc' }, take: 5 } }
  });

  const totalTracks = await prisma.track.count({ where: { artistId } });
  const publishedTracks = await prisma.track.count({ where: { artistId, status: 'PUBLISHED' } });

  res.render('pages/artist/overview', {
    currentArtist: artist,
    artistRole: res.locals.artistRole,
    totalTracks,
    publishedTracks,
    layout: 'layouts/artist-dashboard'
  });
});

// GET /artist/:artistId/tracks
router.get('/:artistId/tracks', requireArtistRole(), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { tracks: { orderBy: { createdAt: 'desc' } } }
  });

  res.render('pages/artist/tracks', {
    currentArtist: artist,
    artistRole: res.locals.artistRole,
    tracks: artist.tracks,
    layout: 'layouts/artist-dashboard'
  });
});

// GET /artist/:artistId/tracks/new
router.get('/:artistId/tracks/new', requireArtistRole(['OWNER', 'MANAGER', 'EDITOR']), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });

  res.render('pages/artist/track-form', {
    currentArtist: artist,
    artistRole: res.locals.artistRole,
    track: null,
    error: null,
    layout: 'layouts/artist-dashboard'
  });
});

// GET /artist/:artistId/tracks/:trackId/edit
router.get('/:artistId/tracks/:trackId/edit', requireArtistRole(['OWNER', 'MANAGER', 'EDITOR']), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const trackId = parseInt(req.params.trackId, 10);
  
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  const track = await prisma.track.findUnique({ where: { id: trackId, artistId } });

  if (!track) return res.redirect(`/artist/${artistId}/tracks`);

  res.render('pages/artist/track-form', {
    currentArtist: artist,
    artistRole: res.locals.artistRole,
    track,
    error: null,
    layout: 'layouts/artist-dashboard'
  });
});

// POST /artist/:artistId/tracks (Create)
// POST /artist/:artistId/tracks/:trackId (Edit)
router.post(['/:artistId/tracks', '/:artistId/tracks/:trackId'], requireArtistRole(['OWNER', 'MANAGER', 'EDITOR']), upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const trackId = req.params.trackId ? parseInt(req.params.trackId, 10) : null;
  const { title, action } = req.body;
  
  const artist = await prisma.artist.findUnique({ where: { id: artistId } });

  const renderError = (errorMsg) => {
    removeFiles(req.files);
    res.render('pages/artist/track-form', {
      currentArtist: artist,
      artistRole: res.locals.artistRole,
      track: trackId ? { id: trackId, title } : null,
      error: errorMsg,
      layout: 'layouts/artist-dashboard'
    });
  };

  if (!title || title.trim() === '') {
    return renderError('Title is required');
  }

  // Image size limit check
  if (req.files && req.files['cover'] && req.files['cover'][0].size > 10 * 1024 * 1024) {
    return renderError('Cover image is too large. Max 10MB.');
  }

  let audioUrl = undefined;
  let coverUrl = undefined;

  try {
    if (req.files && req.files['audio']) {
      const file = req.files['audio'][0];
      audioUrl = `/uploads/audio/tracks/${file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          localPath: file.path,
          publicUrl: audioUrl,
          type: 'AUDIO'
        }
      });
    }

    if (req.files && req.files['cover']) {
      const file = req.files['cover'][0];
      coverUrl = `/uploads/images/covers/${file.filename}`;
      await prisma.mediaAsset.create({
        data: {
          ownerUserId: req.session.userId,
          originalFilename: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          localPath: file.path,
          publicUrl: coverUrl,
          type: 'IMAGE'
        }
      });
    }

    let track;
    if (trackId) {
      // Fetch existing track to check if it has audioUrl if we are publishing
      track = await prisma.track.findUnique({ where: { id: trackId } });
      const finalAudioUrl = audioUrl !== undefined ? audioUrl : track.audioUrl;

      if (action === 'publish' && !finalAudioUrl) {
        return renderError('Cannot publish track without an audio file.');
      }

      track = await prisma.track.update({
        where: { id: trackId },
        data: {
          title: title.trim(),
          ...(audioUrl && { audioUrl }),
          ...(coverUrl && { coverUrl }),
          status: action === 'publish' ? 'PUBLISHED' : 'DRAFT'
        }
      });
    } else {
      if (action === 'publish' && !audioUrl) {
        return renderError('Cannot publish track without an audio file.');
      }

      track = await prisma.track.create({
        data: {
          artistId,
          title: title.trim(),
          audioUrl,
          coverUrl,
          status: action === 'publish' ? 'PUBLISHED' : 'DRAFT'
        }
      });
    }

    res.redirect(`/artist/${artistId}/tracks`);
  } catch (err) {
    console.error(err);
    renderError('Server error while saving track');
  }
});

// POST /artist/:artistId/tracks/:trackId/publish
router.post('/:artistId/tracks/:trackId/publish', requireArtistRole(['OWNER', 'MANAGER', 'EDITOR']), async (req, res) => {
  const artistId = parseInt(req.params.artistId, 10);
  const trackId = parseInt(req.params.trackId, 10);

  const track = await prisma.track.findUnique({ where: { id: trackId, artistId } });
  if (!track) return res.status(404).send('Track not found');

  if (!track.audioUrl) {
    return res.status(400).send('Cannot publish track without an audio file');
  }

  await prisma.track.update({
    where: { id: trackId },
    data: { status: 'PUBLISHED' }
  });

  res.redirect(`/artist/${artistId}/tracks`);
});

module.exports = router;
