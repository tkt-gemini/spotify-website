const { User, Track, Playlist } = require('../models');
const mockDb = require('../data/mockDb');

async function seedDatabase() {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding database with mock data...');
      
      // Seed Users
      for (const u of mockDb.users) {
        await User.create({
          id: u.id, // Explicitly keep ID for matching in mock
          username: u.username,
          role: u.role,
          name: u.name
        });
      }

      // Seed Tracks
      for (const t of mockDb.tracks) {
        await Track.create({
          id: t.id,
          title: t.title,
          artist: t.artist,
          cover: t.cover,
          audio: t.audio,
          type: t.type,
          isPremium: t.isPremium,
          playCount: t.playCount
        });
      }

      // Seed Playlists
      for (const p of mockDb.playlists) {
        const playlist = await Playlist.create({
          id: p.id,
          title: p.title,
          creator: p.creator
        });
        
        // Link tracks
        if (p.tracks && p.tracks.length > 0) {
          const tracks = await Track.findAll({ where: { id: p.tracks } });
          await playlist.addTracks(tracks);
        }
      }
      
      console.log('Seeding completed successfully!');
    } else {
      console.log('Database already contains data, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

module.exports = seedDatabase;
