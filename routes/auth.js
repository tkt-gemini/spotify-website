const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

router.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  if (req.session.user) return res.redirect('/');
  res.render('pages/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.render('pages/login', { error: 'Tài khoản không tồn tại' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render('pages/login', { error: 'Tài khoản hoặc mật khẩu không đúng' });
    const { ArtistProfile, PodcasterProfile } = require('../models');
    const artistProfile = await ArtistProfile.findOne({ where: { userId: user.id } });
    const podcasterProfile = await PodcasterProfile.findOne({ where: { userId: user.id } });
    
    req.session.user = { 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      avatar: user.avatar,
      isArtist: !!artistProfile,
      isPodcaster: !!podcasterProfile
    };
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { error: 'Lỗi máy chủ' });
  }
});

router.get('/register', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  if (req.session.user) return res.redirect('/');
  res.render('pages/register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.render('pages/register', { error: 'Tên tài khoản đã tồn tại' });
    
    await User.create({ username, password, name });
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Register error:', error);
    res.render('pages/register', { error: 'Lỗi máy chủ' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
