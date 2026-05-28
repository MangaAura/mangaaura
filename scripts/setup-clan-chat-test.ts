import { prisma } from '../src/lib/prisma';

async function main() {
  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@mangaaura.com' },
    select: { id: true, username: true },
  });

  if (!admin) {
    console.log('Admin user not found. Run scripts/create-admin-user.ts first.');
    const users = await prisma.user.findMany({ take: 3, select: { id: true, email: true, username: true } });
    console.log('Available users:', JSON.stringify(users));
    return;
  }

  console.log('Admin found:', admin.username);

  // Check existing clans
  const existingClans = await prisma.clan.findMany({ select: { id: true, name: true } });
  console.log('Existing clans:', JSON.stringify(existingClans));

  // Create a test clan if none exists
  let clanId: string;
  if (existingClans.length === 0) {
    const clan = await prisma.clan.create({
      data: {
        name: 'MangaAura Legends',
        description: 'Clan oficial de MangaAura',
        leaderId: admin.id,
        memberCount: 1,
      },
    });
    clanId = clan.id;
    console.log('Created clan:', clan.name, clanId);
  } else {
    clanId = existingClans[0].id;
    console.log('Using existing clan:', existingClans[0].name, clanId);
  }

  // Check if admin is already a member
  const existingMembership = await prisma.clanMembership.findFirst({
    where: { userId: admin.id, clanId },
  });

  if (!existingMembership) {
    await prisma.clanMembership.create({
      data: {
        userId: admin.id,
        clanId,
        role: 'LEADER',
      },
    });
    console.log('Added admin as LEADER of clan');
  } else {
    console.log('Admin is already a clan member with role:', existingMembership.role);
  }

  // Update member count
  const memberCount = await prisma.clanMembership.count({ where: { clanId } });
  await prisma.clan.update({
    where: { id: clanId },
    data: { memberCount },
  });

  // Create a test welcome message
  const existingMessages = await prisma.clanChatMessage.count({ where: { clanId } });
  if (existingMessages === 0) {
    await prisma.clanChatMessage.create({
      data: {
        clanId,
        senderId: admin.id,
        content: '¡Bienvenidos al chat del clan MangaAura Legends! 🎉',
      },
    });
    console.log('Created welcome message');
  } else {
    console.log('Messages already exist:', existingMessages);
  }

  console.log('\n✅ Setup complete!');
  console.log('Clan:', clanId);
  console.log('Login: admin@mangaaura.com / Admin123!');
  console.log('Go to: http://localhost:3000/es/messages');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
