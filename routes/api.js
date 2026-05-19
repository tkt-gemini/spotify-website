const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Track } = require('../models');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, path.join(__dirname, '../public/media/audio'));
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(__dirname, '../public/media/covers'));
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// API Endpoint to stream audio
router.get('/stream/:id', async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

  // Access Control check
  if (track.isPremium && req.session.user.role === 'free') {
    return res.status(403).json({ error: 'Premium content. Please upgrade your account.' });
  }

  const audioPath = path.join(__dirname, '../public', track.audio);
  
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: 'Audio file missing on server' });
  }

  const stat = fs.statSync(audioPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(audioPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Endpoint to track plays
router.post('/track-play/:id', async (req, res) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (track) {
      track.playCount += 1;
      await track.save();
      res.json({ success: true, newCount: track.playCount });
    } else {
      res.status(404).json({ error: 'Track not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Endpoint for creator upload
router.post('/upload', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  if (req.session.user.role !== 'creator') {
    return res.status(403).json({ error: 'Only creators can upload content.' });
  }

  try {
    const audioFile = req.files['audio'][0];
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    await Track.create({
      id: 'c' + Date.now(),
      title: req.body.title || 'Untitled',
      artist: req.session.user.name,
      cover: coverFile ? '/media/covers/' + coverFile.filename : 'https://picsum.photos/seed/new/200/200',
      audio: '/media/audio/' + audioFile.filename,
      type: req.body.type || 'song',
      isPremium: req.body.isPremium === 'true',
      playCount: 0
    });

    res.redirect('/creator?success=true');
  } catch (err) {
    res.status(400).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;
