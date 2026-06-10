const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');
const fs = require('fs');
const path = require('path');

function generateDummyWav(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // A 1-second 8kHz 8-bit mono silent WAV file
  const buffer = Buffer.alloc(44 + 8000);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + 8000, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(8000, 40);
  fs.writeFileSync(filePath, buffer);
}

async function main() {
  // Clear tables (optional but helps idempotency)
  // We'll use upsert to keep it idempotent safely

  console.log('Generating dummy WAV files...');
  const baseUploads = path.join(__dirname, '../uploads/audio/demo');
  const demoWavsPaths = [
    path.join(baseUploads, 'demo1.wav'),
    path.join(baseUploads, 'demo2.wav'),
    path.join(baseUploads, 'demo3.wav')
  ];
  demoWavsPaths.forEach(generateDummyWav);

  const audioUrls = [
    '/uploads/audio/demo/demo1.wav',
    '/uploads/audio/demo/demo2.wav',
    '/uploads/audio/demo/demo3.wav'
  ];

  console.log('Upserting base users...');
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'user@example.com', name: 'Standard User', role: 'USER' },
    { email: 'artist@example.com', name: 'Artist User', role: 'ARTIST' },
    { email: 'podcaster@example.com', name: 'Podcaster User', role: 'PODCASTER' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { defaultRole: u.role, plan: 'FREE', status: 'ACTIVE' },
      create: {
        email: u.email, name: u.name, passwordHash,
        defaultRole: u.role, plan: 'FREE', status: 'ACTIVE'
      }
    });
  }

  const artistUser = await prisma.user.findUnique({ where: { email: 'artist@example.com' } });
  const podcasterUser = await prisma.user.findUnique({ where: { email: 'podcaster@example.com' } });
  const standardUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  const genres = ['Pop', 'Rock', 'Lo-fi', 'EDM', 'Ballad', 'Hip-hop'];
  const categories = ['Technology', 'Education', 'News', 'Storytelling'];

  console.log('Creating 15 artists...');
  const artistIds = [];
  for (let i = 1; i <= 15; i++) {
    const artistName = `Artist ${i}`;
    let artist = await prisma.artist.findFirst({ where: { name: artistName } });
    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          name: artistName,
          bio: `Bio for Artist ${i}`,
          status: 'PUBLISHED',
          createdById: artistUser.id,
          teamMembers: { create: { userId: artistUser.id, role: 'OWNER' } }
        }
      });
    }
    artistIds.push(artist.id);
  }

  console.log('Creating 10 albums...');
  const albumIds = [];
  for (let i = 1; i <= 10; i++) {
    const title = `Album ${i}`;
    const artistId = artistIds[i % artistIds.length];
    const genre = genres[i % genres.length];
    let album = await prisma.album.findFirst({ where: { title, artistId } });
    if (!album) {
      album = await prisma.album.create({
        data: {
          title, artistId, genre,
          status: 'PUBLISHED'
        }
      });
    }
    albumIds.push(album.id);
  }

  console.log('Creating 50 tracks...');
  for (let i = 1; i <= 50; i++) {
    const title = `Track ${i}`;
    const artistId = artistIds[i % artistIds.length];
    const albumId = albumIds[i % albumIds.length];
    const genre = genres[i % genres.length];
    const status = i > 45 ? 'DRAFT' : 'PUBLISHED';
    // first 15 tracks get audio
    const audioUrl = i <= 15 ? audioUrls[i % audioUrls.length] : null;

    let track = await prisma.track.findFirst({ where: { title, artistId } });
    if (!track) {
      await prisma.track.create({
        data: {
          title, artistId, albumId, genre, status,
          duration: 180 + i,
          audioUrl: audioUrl
        }
      });
    } else {
      await prisma.track.update({
        where: { id: track.id },
        data: { genre, status, audioUrl }
      });
    }
  }

  console.log('Creating 8 podcast shows...');
  const showIds = [];
  for (let i = 1; i <= 8; i++) {
    const title = `Podcast Show ${i}`;
    const category = categories[i % categories.length];
    let show = await prisma.podcastShow.findFirst({ where: { title } });
    if (!show) {
      show = await prisma.podcastShow.create({
        data: {
          title, category,
          description: `Description for ${title}`,
          status: 'PUBLISHED',
          ownerId: podcasterUser.id,
          teamMembers: { create: { userId: podcasterUser.id, role: 'OWNER' } }
        }
      });
    } else {
      await prisma.podcastShow.update({
        where: { id: show.id },
        data: { category }
      });
    }
    showIds.push(show.id);
  }

  console.log('Creating 20 podcast episodes...');
  for (let i = 1; i <= 20; i++) {
    const title = `Episode ${i}`;
    const showId = showIds[i % showIds.length];
    const category = categories[i % categories.length];
    const status = i > 18 ? 'DRAFT' : 'PUBLISHED';
    const audioUrl = i <= 10 ? audioUrls[i % audioUrls.length] : null;

    let episode = await prisma.podcastEpisode.findFirst({ where: { title, showId } });
    if (!episode) {
      await prisma.podcastEpisode.create({
        data: {
          title, showId, category, status,
          description: `Description for ${title}`,
          duration: 3600 + i * 10,
          audioUrl: audioUrl
        }
      });
    } else {
      await prisma.podcastEpisode.update({
        where: { id: episode.id },
        data: { category, status, audioUrl }
      });
    }
  }

  console.log('Creating 2 public playlists...');
  for (let i = 1; i <= 2; i++) {
    const name = `Demo Public Playlist ${i}`;
    let playlist = await prisma.playlist.findFirst({ where: { name, userId: standardUser.id } });
    if (!playlist) {
      await prisma.playlist.create({
        data: {
          name,
          userId: standardUser.id,
          description: `A demo public playlist ${i}.`,
          isPublic: true
        }
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
