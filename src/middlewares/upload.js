const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Setup storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = 'uploads/';
    if (file.fieldname === 'audio') dest += 'audio/tracks';
    else if (file.fieldname === 'cover') dest += 'images/covers';
    else if (file.fieldname === 'avatar') dest += 'images/avatars';
    else if (file.fieldname === 'banner') dest += 'images/banners';
    else dest += 'temp';

    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = crypto.randomUUID() + ext;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'];
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'), false);
    }
  } else if (['cover', 'avatar', 'banner'].includes(file.fieldname)) {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Multer upload instance
// We set a general limit of 100MB here because it's the largest limit (for audio).
// For images (10MB limit), we will enforce it manually in the route or middleware wrapper.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Podcaster specific storage
const podcastCoverStorage = multer.diskStorage({
  destination: 'uploads/images/covers',
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  }
});

const episodeAudioStorage = multer.diskStorage({
  destination: 'uploads/audio/episodes',
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  }
});

const uploadPodcastShowCover = multer({
  storage: podcastCoverStorage,
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadEpisodeAudio = multer({
  storage: episodeAudioStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'), false);
    }
  },
  limits: { fileSize: 300 * 1024 * 1024 } // 300MB
});

module.exports = {
  upload,
  uploadPodcastShowCover,
  uploadEpisodeAudio
};
