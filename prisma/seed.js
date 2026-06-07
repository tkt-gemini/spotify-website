const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

async function main() {
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
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        defaultRole: u.role
      }
    });
  }

  // Get user@example.com for owner associations
  const demoUser = await prisma.user.findUnique({ where: { email: 'user@example.com' } });

  // 1. Create Demo Artist (upsert based on name or ID? Since we don't have a unique constraint on name, we will try to find first, if not create)
  let demoArtist = await prisma.artist.findFirst({ where: { name: 'Demo Artist' } });
  if (!demoArtist) {
    demoArtist = await prisma.artist.create({
      data: {
        name: 'Demo Artist',
        bio: 'This is a demo artist for Phase 2.',
        status: 'PUBLISHED',
        createdById: demoUser.id,
        teamMembers: {
          create: {
            userId: demoUser.id,
            role: 'OWNER'
          }
        }
      }
    });
  }

  // 2. Create Demo Album
  let demoAlbum = await prisma.album.findFirst({ where: { title: 'Demo Album', artistId: demoArtist.id } });
  if (!demoAlbum) {
    demoAlbum = await prisma.album.create({
      data: {
        artistId: demoArtist.id,
        title: 'Demo Album',
        status: 'PUBLISHED'
      }
    });
  }

  // 3. Create Demo Tracks
  const trackData = [
    { title: 'Demo Track 1 - The Beginning', duration: 180, audioUrl: '/audio/demo1.mp3' },
    { title: 'Demo Track 2 - No Audio', duration: 200, audioUrl: null },
    { title: 'Demo Track 3 - The Finale', duration: 210, audioUrl: '/audio/demo3.mp3' }
  ];

  for (const t of trackData) {
    const existingTrack = await prisma.track.findFirst({ where: { title: t.title, artistId: demoArtist.id } });
    if (!existingTrack) {
      await prisma.track.create({
        data: {
          artistId: demoArtist.id,
          albumId: demoAlbum.id,
          title: t.title,
          duration: t.duration,
          audioUrl: t.audioUrl,
          status: 'PUBLISHED'
        }
      });
    }
  }

  // 4. Create Demo Public Playlist for user@example.com
  let demoPlaylist = await prisma.playlist.findFirst({ where: { name: 'Demo Public Playlist', userId: demoUser.id } });
  if (!demoPlaylist) {
    demoPlaylist = await prisma.playlist.create({
      data: {
        userId: demoUser.id,
        name: 'Demo Public Playlist',
        description: 'A demo playlist created during seed.',
        isPublic: true
      }
    });
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
