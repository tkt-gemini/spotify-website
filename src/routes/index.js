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
  password_too_short: 'Mật khẩu phải có ít nhất 6 ký tự.'
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
  const tracks = await prisma.track.findMany({
    where: { status: 'PUBLISHED' },
    include: { artist: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.render('pages/user/home', { tracks, layout: 'layouts/user-app' });
});

router.get('/app/search', requireAuth, (req, res) => {
  res.render('pages/user/search', { layout: 'layouts/user-app' });
});

router.get('/app/library', requireAuth, (req, res) => {
  res.render('pages/user/library', { layout: 'layouts/user-app' });
});

// Protected Role routes (Placeholder for now)
router.get('/artist/select', requireAuth, (req, res) => res.render('pages/artist/select', { layout: 'layouts/user-app' }));
router.get('/podcaster/shows', requireAuth, (req, res) => res.render('pages/podcaster/shows', { layout: 'layouts/user-app' }));

// API Routes
router.post('/api/v1/playback/start', requireAuth, async (req, res) => {
  const { entityType, entityId } = req.body;
  
  if (entityType !== 'track') {
    return res.status(400).json({ success: false, error: 'Only tracks are supported in Phase 1' });
  }

  const trackId = parseInt(entityId, 10);
  if (isNaN(trackId)) {
    return res.status(400).json({ success: false, error: 'Invalid track ID' });
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { artist: true }
  });

  if (!track) {
    return res.status(404).json({ success: false, error: 'Track not found' });
  }

  if (track.status !== 'PUBLISHED') {
    return res.status(403).json({ success: false, error: 'Track is not available' });
  }

  if (!track.audioUrl) {
    return res.status(400).json({ success: false, error: 'Track has no audio URL' });
  }

  const playbackSessionId = crypto.randomUUID();

  await prisma.playbackEvent.create({
    data: {
      playbackSessionId,
      userId: req.session.userId,
      trackId: track.id,
      eventType: 'TRACK_STARTED'
    }
  });

  res.json({
    success: true,
    playbackSessionId,
    title: track.title,
    artistName: track.artist.name,
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl
  });
});

module.exports = router;
