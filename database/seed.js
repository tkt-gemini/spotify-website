const { User, Track, Playlist, PodcastShow, PodcastEpisode, ArtistProfile, PodcasterProfile } = require('../models');
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
          password: 'password123',
          name: u.name
        });
      }

      // Seed Artists
      if (mockDb.artists) {
        for (const a of mockDb.artists) {
          await ArtistProfile.create({
            id: a.id,
            name: a.name,
            userId: a.userId,
            avatar: a.avatar,
            bio: a.bio
          });
        }
      }

      // Seed Podcasters
      if (mockDb.podcasters) {
        for (const p of mockDb.podcasters) {
          await PodcasterProfile.create({
            id: p.id,
            name: p.name,
            userId: p.userId,
            avatar: p.avatar,
            description: p.description
          });
        }
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
          creatorId: 1 // Link to the first mock user
        });
        
        // Link tracks
        if (p.tracks && p.tracks.length > 0) {
          const tracks = await Track.findAll({ where: { id: p.tracks } });
          await playlist.addTracks(tracks);
        }
      }
      // Seed Podcasts
      if (mockDb.podcasts) {
        for (const p of mockDb.podcasts) {
          await PodcastShow.create({
            id: p.id,
            title: p.title,
            description: p.description,
            cover: p.cover,
            ownerId: 3 // Link to Creator User (id: 3)
          });
          
          if (p.episodes) {
            for (const ep of p.episodes) {
              await PodcastEpisode.create({
                id: ep.id,
                showId: p.id,
                title: ep.title,
                description: ep.description,
                audio: ep.audio,
                duration_ms: ep.duration_ms
              });
            }
          }
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
