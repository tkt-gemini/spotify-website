const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Allowed file type lists ─────────────────────────────────────────────────
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.aac'];

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;  // 5 MB
const AUDIO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── Generic image storage (playlists / avatars) ─────────────────────────────
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/playlists');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use only a safe extension from the allow-list — never trust user input
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'cover-' + uniqueSuffix + ext);
  }
});

const imageFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_EXTS.includes(ext)) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

// ─── Podcast cover storage ───────────────────────────────────────────────────
const podcastCoverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/podcasts/covers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'show-' + uniqueSuffix + ext);
  }
});

// ─── Podcast audio storage ───────────────────────────────────────────────────
const podcastAudioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/podcasts/audio');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'ep-' + uniqueSuffix + ext);
  }
});

// ─── Track audio storage ─────────────────────────────────────────────────────
const trackAudioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/tracks/audio');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'track-' + uniqueSuffix + ext);
  }
});

const audioFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_AUDIO_EXTS.includes(ext)) return cb(null, true);
  cb(new Error('INVALID_FILE_TYPE'));
};

// ─── Album cover storage ───────────────────────────────────────────────────
const albumCoverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/albums/covers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'album-' + uniqueSuffix + ext);
  }
});
const uploadAlbumCover = multer({ storage: albumCoverStorage, fileFilter: imageFilter, limits: { fileSize: IMAGE_MAX_BYTES } });

// ─── Exports ─────────────────────────────────────────────────────────────────
const uploadHandler = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: IMAGE_MAX_BYTES } });

const uploadPodcastCover = multer({ storage: podcastCoverStorage, fileFilter: imageFilter, limits: { fileSize: IMAGE_MAX_BYTES } });

const uploadPodcastAudio = multer({ storage: podcastAudioStorage, fileFilter: audioFilter, limits: { fileSize: AUDIO_MAX_BYTES } });

const uploadTrackAudio = multer({ storage: trackAudioStorage, fileFilter: audioFilter, limits: { fileSize: AUDIO_MAX_BYTES } });

module.exports = uploadHandler;
module.exports.uploadPodcastCover = uploadPodcastCover;
module.exports.uploadPodcastAudio = uploadPodcastAudio;
module.exports.uploadTrackAudio = uploadTrackAudio;
module.exports.uploadAlbumCover = uploadAlbumCover;


