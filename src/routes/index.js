const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');

// Public routes
router.get('/', (req, res) => res.render('pages/home'));
router.get('/login', (req, res) => res.render('pages/auth/login'));
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcrypt');
  const prisma = require('../config/prisma');
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    req.session.userId = user.id;
    return res.redirect('/app/home');
  }
  res.redirect('/login');
});
router.get('/register', (req, res) => res.render('pages/auth/register'));
router.post('/register', (req, res) => res.redirect('/login'));
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Protected App routes
router.get('/app/home', requireAuth, (req, res) => res.render('pages/user/home'));
router.get('/app/search', requireAuth, (req, res) => res.render('pages/user/search'));
router.get('/app/library', requireAuth, (req, res) => res.render('pages/user/library'));

// Protected Role routes
router.get('/artist/select', requireAuth, (req, res) => res.render('pages/artist/select'));
router.get('/podcaster/shows', requireAuth, (req, res) => res.render('pages/podcaster/shows'));

// API Routes
router.post('/api/v1/playback/start', requireAuth, (req, res) => res.json({ success: true }));

module.exports = router;
