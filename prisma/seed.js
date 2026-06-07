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
