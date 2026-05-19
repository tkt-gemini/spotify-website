var express = require('express');
var router = express.Router();

const { Track, Playlist, User } = require('../models');

// Helper to render pages seamlessly
function renderPage(req, res, page, title, extraData = {}) {
  const data = { title, user: req.session.user, ...extraData };
  if (res.locals.isPartial) {
    res.render(`pages/${page}`, data);
  } else {
    res.render('layout', { page: `pages/${page}`, ...data });
  }
}

router.get('/', async function(req, res, next) {
  try {
    const tracks = await Track.findAll();
    const playlists = await Playlist.findAll({ include: 'tracks' });
    renderPage(req, res, 'home', 'Home - Antigravity', { tracks, playlists });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async function(req, res, next) {
  try {
    const tracks = await Track.findAll();
    renderPage(req, res, 'search', 'Search - Antigravity', { tracks });
  } catch (error) {
    next(error);
  }
});

router.get('/library', async function(req, res, next) {
  try {
    const playlists = await Playlist.findAll({ include: 'tracks' });
    renderPage(req, res, 'library', 'Your Library - Antigravity', { playlists });
  } catch (error) {
    next(error);
  }
});

router.get('/creator', function(req, res, next) {
  if (req.session.user.role !== 'creator') {
    return res.status(403).send("Forbidden. You need creator access.");
  }
  renderPage(req, res, 'creator', 'Creator Studio - Antigravity');
});

// User role switching for demo
router.get('/switch-role/:role', async (req, res, next) => {
  try {
    const role = req.params.role;
    const user = await User.findOne({ where: { role } });
    if (user) {
      req.session.user = user.toJSON();
    }
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
