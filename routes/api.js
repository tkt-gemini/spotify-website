const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadHandler');
const { uploadPodcastCover, uploadPodcastAudio, uploadTrackAudio, uploadAlbumCover } = require('../middlewares/uploadHandler');

// Require services instead of models
const PlaylistService = require('../services/PlaylistService');
const UserService = require('../services/UserService');
const SearchService = require('../services/SearchService');
const TrackService = require('../services/TrackService');
const LibraryService = require('../services/LibraryService');
const StudioService = require('../services/StudioService');


// Require authentication for API
router.use((req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// POST /api/playlists — Create a new playlist
router.post('/playlists', async (req, res, next) => {
  try {
    const playlist = await PlaylistService.createPlaylist(req.session.user.id);
    res.json({ success: true, playlist });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/folder — Create a new folder
router.post('/playlists/folder', async (req, res, next) => {
  try {
    const folder = await PlaylistService.createFolder(req.session.user.id);
    res.json({ success: true, folder });
  } catch (err) {
    next(err);
  }
});

// GET /api/playlists/mine — Get user's playlists
router.get('/playlists/mine', async (req, res, next) => {
  try {
    const playlists = await PlaylistService.getUserPlaylists(req.session.user.id);
    res.json({ success: true, playlists });
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:id/tracks — Add a track to playlist
router.post('/playlists/:id/tracks', async (req, res, next) => {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'trackId is required' });
    
    await PlaylistService.addTrackToPlaylist(req.params.id, req.session.user.id, trackId);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    next(err);
  }
});

// GET /api/library/check?trackId=...
router.get('/library/check', async (req, res) => {
  try {
    const trackId = req.query.trackId;
    if (!trackId) return res.status(400).json({ error: 'Missing trackId' });
    
    // LibraryService doesn't have check method, we'll implement it or use raw for now
    // Actually let's assume we can add it to LibraryService if needed, or implement it here
    // Wait, LibraryService was already implemented? Let's check... I will add it to LibraryService.
    const isLiked = await LibraryService.checkItem(req.session.user.id, trackId, 'track');
    res.json({ success: true, isLiked });
  } catch (err) {
    console.error('Error checking library:', err);
    res.status(500).json({ error: 'Failed to check library' });
  }
});

// POST /api/library/toggle-artist
router.post('/library/toggle-artist', async (req, res) => {
  try {
    const { artistName } = req.body;
    if (!artistName) return res.status(400).json({ error: 'Artist name is required' });

    const isFollowing = await LibraryService.toggleArtist(req.session.user.id, artistName);
    res.json({ success: true, isFollowing });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Artist not found' });
    console.error('Error toggling artist:', err);
    res.status(500).json({ error: 'Failed to toggle artist follow state' });
  }
});

// POST /api/library/toggle-playlist
router.post('/library/toggle-playlist', async (req, res) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) return res.status(400).json({ error: 'Playlist ID is required' });

    const isSaved = await LibraryService.togglePlaylist(req.session.user.id, playlistId);
    res.json({ success: true, isSaved });
  } catch (err) {
    console.error('Error toggling playlist:', err);
    res.status(500).json({ error: 'Failed to toggle playlist save state' });
  }
});

// POST /api/library/toggle-podcast
router.post('/library/toggle-podcast', async (req, res) => {
  try {
    const { podcastId } = req.body;
    if (!podcastId) return res.status(400).json({ error: 'Podcast ID is required' });

    const isFollowing = await LibraryService.togglePodcast(req.session.user.id, podcastId);
    res.json({ success: true, isFollowing });
  } catch (err) {
    console.error('Error toggling podcast:', err);
    res.status(500).json({ error: 'Failed to toggle podcast follow state' });
  }
});

// POST /api/library/toggle-episode
router.post('/library/toggle-episode', async (req, res) => {
  try {
    const { episodeId } = req.body;
    if (!episodeId) return res.status(400).json({ error: 'Episode ID is required' });

    const isSaved = await LibraryService.toggleEpisode(req.session.user.id, episodeId);
    res.json({ success: true, isSaved });
  } catch (err) {
    console.error('Error toggling episode:', err);
    res.status(500).json({ error: 'Failed to toggle episode save state' });
  }
});

// GET /api/playlists/:id - Get a single playlist with its tracks
router.get('/playlists/:id', async (req, res) => {
  try {
    const data = await PlaylistService.getPlaylistDetails(req.params.id, req.session.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Playlist not found' });
    if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Access denied' });
    console.error('Error fetching playlist:', err);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// PUT /api/playlists/:id - Update playlist title/cover
router.put('/playlists/:id', upload.single('coverImage'), async (req, res) => {
  try {
    const playlist = await PlaylistService.updatePlaylist(
      req.params.id, 
      req.session.user.id, 
      req.body, 
      req.file
    );
    res.json({ success: true, playlist });
  } catch (error) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Playlist not found or you are not the creator' });
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/playlists/:id - Delete a playlist
router.delete('/playlists/:id', async (req, res) => {
  try {
    await PlaylistService.deletePlaylist(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Playlist not found' });
    console.error('Error deleting playlist:', err);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// POST /api/user/register-artist
router.post('/user/register-artist', async (req, res) => {
  try {
    await UserService.registerArtist(req.session.user.id);
    res.json({ success: true, message: 'Successfully registered as an artist' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
    console.error('Error registering as artist:', err);
    res.status(500).json({ error: 'Failed to register as artist' });
  }
});

// POST /api/user/register-podcaster
router.post('/user/register-podcaster', async (req, res) => {
  try {
    await UserService.registerPodcaster(req.session.user.id);
    res.json({ success: true, message: 'Successfully registered as a podcaster' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
    console.error('Error registering as podcaster:', err);
    res.status(500).json({ error: 'Failed to register as podcaster' });
  }
});

// GET /api/tracks/:id - Get a track by id
router.get('/tracks/:id', async (req, res) => {
  try {
    const track = await TrackService.getTrack(req.params.id);
    res.json({ success: true, track });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track not found' });
    console.error('Error fetching track:', err);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// POST /api/tracks/:id/play - Record a play event for a track
router.post('/tracks/:id/play', async (req, res) => {
  try {
    const newPlayCount = await TrackService.recordPlay(req.params.id, req.session.user.id);
    res.json({ success: true, playCount: newPlayCount });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track not found' });
    console.error('Error recording play:', err);
    res.status(500).json({ error: 'Failed to record play event' });
  }
});

// POST /api/tracks/:id/add-to-playlists - Add a track to multiple playlists
router.post('/tracks/:id/add-to-playlists', async (req, res) => {
  try {
    const { playlistIds } = req.body;
    if (!playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ error: 'playlistIds array is required' });
    }

    await TrackService.addToPlaylists(req.params.id, playlistIds, req.session.user.id);
    res.json({ success: true, message: 'Track added to playlists successfully' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track or playlists not found' });
    console.error('Error adding track to playlists:', err);
    res.status(500).json({ error: 'Failed to add track to playlists' });
  }
});

// POST /api/tracks/:id/remove-from-playlists - Remove a track from multiple playlists
router.post('/tracks/:id/remove-from-playlists', async (req, res) => {
  try {
    const { playlistIds } = req.body;
    if (!playlistIds || !Array.isArray(playlistIds)) {
      return res.status(400).json({ error: 'playlistIds array is required' });
    }

    await TrackService.removeFromPlaylists(req.params.id, playlistIds, req.session.user.id);
    res.json({ success: true, message: 'Track removed from playlists successfully' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track or playlists not found' });
    console.error('Error removing track from playlists:', err);
    res.status(500).json({ error: 'Failed to remove track from playlists' });
  }
});

// GET /api/search - Return search results as JSON
router.get('/search', async (req, res, next) => {
  try {
    const searchResults = await SearchService.searchAll(req.query.q || '');
    res.json({ searchResults });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile - Update user profile
router.put('/users/profile', upload.single('avatar'), async (req, res, next) => {
  try {
    const data = await UserService.updateProfile(req.session.user.id, req.body.name, req.file);
    
    // Update session
    req.session.user.name = data.name;
    if (data.avatar) req.session.user.avatar = data.avatar;

    res.json({ success: true, user: data });
  } catch (err) {
    if (err.message === 'INVALID_INPUT') return res.status(400).json({ success: false, error: 'Name cannot be empty' });
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'User not found' });
    next(err);
  }
});

// GET /api/user/playlists - Fetch lightweight list of user's created playlists
router.get('/user/playlists', async (req, res, next) => {
  try {
    const playlists = await PlaylistService.getUserPlaylists(req.session.user.id);
    res.json({ success: true, playlists });
  } catch (err) {
    next(err);
  }
});

// POST /api/library/toggle-track - Like/Unlike a track
router.post('/library/toggle-track', async (req, res, next) => {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'Track ID is required' });

    const isLiked = await LibraryService.toggleTrack(req.session.user.id, trackId);
    res.json({ success: true, isLiked });
  } catch (err) {
    next(err);
  }
});


// ═══════════════════════════════════════════════════════════════════
// STUDIO ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/studio/overview — Studio hub data (artist + creator status)
router.get('/studio/overview', async (req, res, next) => {
  try {
    const overview = await StudioService.getStudioOverview(req.session.user.id);
    res.json({ success: true, ...overview });
  } catch (err) {
    next(err);
  }
});

// ── ARTIST ──────────────────────────────────────────────────────────

// GET /api/studio/artist — Artist profile + tracks
router.get('/studio/artist', async (req, res, next) => {
  try {
    const data = await StudioService.getArtistProfile(req.session.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    if (err.message === 'NOT_FOUND' || err.message === 'NOT_ARTIST')
      return res.status(404).json({ error: 'Artist profile not found' });
    next(err);
  }
});

// PUT /api/studio/artist — Update artist profile (avatar + cover upload)
router.put('/studio/artist', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const avatarFile = req.files && req.files['avatar'] ? req.files['avatar'][0] : null;
    const coverFile  = req.files && req.files['coverImage'] ? req.files['coverImage'][0] : null;
    const profile = await StudioService.updateArtistProfile(
      req.session.user.id, req.body, avatarFile, coverFile
    );
    res.json({ success: true, profile });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Artist profile not found' });
    next(err);
  }
});

// POST /api/studio/tracks — Upload a new track for the artist
router.post('/studio/tracks', uploadTrackAudio.single('audio'), async (req, res, next) => {
  try {
    const track = await StudioService.createArtistTrack(req.session.user.id, req.body, req.file);
    res.json({ success: true, track });
  } catch (err) {
    if (err.message === 'INVALID_INPUT') return res.status(400).json({ error: 'Title is required' });
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Artist profile not found' });
    next(err);
  }
});

// PUT /api/studio/tracks/:id — Update track metadata (title, albumId, lyrics)
router.put('/studio/tracks/:id', upload.none(), async (req, res, next) => {
  try {
    const track = await StudioService.updateArtistTrack(req.params.id, req.session.user.id, req.body);
    res.json({ success: true, track });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track not found or unauthorized' });
    next(err);
  }
});

// DELETE /api/studio/tracks/:id — Delete a track
router.delete('/studio/tracks/:id', async (req, res, next) => {
  try {
    await StudioService.deleteArtistTrack(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Track not found or unauthorized' });
    next(err);
  }
});

// POST /api/studio/albums — Create a new album
router.post('/studio/albums', uploadAlbumCover.single('cover'), async (req, res, next) => {
  try {
    const album = await StudioService.createAlbum(req.session.user.id, req.body, req.file);
    res.json({ success: true, album });
  } catch (err) {
    if (err.message === 'INVALID_INPUT') return res.status(400).json({ error: 'Title is required' });
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Artist profile not found' });
    next(err);
  }
});

// PUT /api/studio/albums/:id — Update an album
router.put('/studio/albums/:id', uploadAlbumCover.single('cover'), async (req, res, next) => {
  try {
    const album = await StudioService.updateAlbum(req.params.id, req.session.user.id, req.body, req.file);
    res.json({ success: true, album });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Album not found or unauthorized' });
    next(err);
  }
});

// DELETE /api/studio/albums/:id — Delete an album
router.delete('/studio/albums/:id', async (req, res, next) => {
  try {
    await StudioService.deleteAlbum(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Album not found or unauthorized' });
    next(err);
  }
});

// ── CREATOR (PODCAST) ────────────────────────────────────────────────

// GET /api/studio/shows — List all shows owned by user
router.get('/studio/shows', async (req, res, next) => {
  try {
    const shows = await StudioService.getCreatorShows(req.session.user.id);
    res.json({ success: true, shows });
  } catch (err) {
    next(err);
  }
});

// POST /api/studio/shows — Create a new show
router.post('/studio/shows', uploadPodcastCover.single('cover'), async (req, res, next) => {
  try {
    const show = await StudioService.createShow(req.session.user.id, req.body, req.file);
    res.json({ success: true, show });
  } catch (err) {
    if (err.message === 'INVALID_INPUT') return res.status(400).json({ error: 'Title is required' });
    if (err.message === 'INVALID_FILE_TYPE') return res.status(400).json({ error: 'Invalid file type for cover' });
    next(err);
  }
});

// GET /api/studio/shows/:id — Show details + episodes
router.get('/studio/shows/:id', async (req, res, next) => {
  try {
    const show = await StudioService.getShowDetails(req.params.id, req.session.user.id);
    res.json({ success: true, show });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Show not found' });
    next(err);
  }
});

// PUT /api/studio/shows/:id — Update show info
router.put('/studio/shows/:id', uploadPodcastCover.single('cover'), async (req, res, next) => {
  try {
    const show = await StudioService.updateShow(req.params.id, req.session.user.id, req.body, req.file);
    res.json({ success: true, show });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Show not found' });
    next(err);
  }
});

// DELETE /api/studio/shows/:id — Delete show + all its episodes
router.delete('/studio/shows/:id', async (req, res, next) => {
  try {
    await StudioService.deleteShow(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Show not found' });
    next(err);
  }
});

// POST /api/studio/shows/:id/episodes — Create episode
router.post('/studio/shows/:id/episodes', uploadPodcastAudio.single('audio'), async (req, res, next) => {
  try {
    const episode = await StudioService.createEpisode(req.params.id, req.session.user.id, req.body, req.file);
    res.json({ success: true, episode });
  } catch (err) {
    if (err.message === 'INVALID_INPUT') return res.status(400).json({ error: 'Episode title is required' });
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Show not found' });
    next(err);
  }
});

// PUT /api/studio/episodes/:id — Update episode
router.put('/studio/episodes/:id', uploadPodcastAudio.single('audio'), async (req, res, next) => {
  try {
    const episode = await StudioService.updateEpisode(req.params.id, req.session.user.id, req.body, req.file);
    res.json({ success: true, episode });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Episode not found' });
    next(err);
  }
});

// DELETE /api/studio/episodes/:id — Delete episode
router.delete('/studio/episodes/:id', async (req, res, next) => {
  try {
    await StudioService.deleteEpisode(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Episode not found' });
    next(err);
  }
});

// POST /api/studio/episodes/:id/publish — Publish a draft episode
router.post('/studio/episodes/:id/publish', async (req, res, next) => {
  try {
    const episode = await StudioService.publishEpisode(req.params.id, req.session.user.id);
    res.json({ success: true, episode });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Episode not found' });
    next(err);
  }
});

module.exports = router;

