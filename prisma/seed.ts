import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Type definitions for string enums
const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  CREATOR: 'CREATOR',
} as const;

const MangaStatus = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  HIATUS: 'HIATUS',
  CANCELLED: 'CANCELLED',
} as const;

const ReadingStatus = {
  READING: 'READING',
  COMPLETED: 'COMPLETED',
  PLANNED: 'PLANNED',
  DROPPED: 'DROPPED',
} as const;

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('SecurePass123!', 12);

  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'admin@inkverse.com' },
      update: {},
      create: {
        email: 'admin@inkverse.com',
        username: 'admin',
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.ADMIN,
        xpPoints: 10000,
        level: 10,
        inkcoinsBalance: 5000,
        readingStreak: 100,
      },
    }),
    // Creador
    prisma.user.upsert({
      where: { email: 'creator@inkverse.com' },
      update: {},
      create: {
        email: 'creator@inkverse.com',
        username: 'aiartist',
        displayName: 'AI Artist Pro',
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.CREATOR,
        xpPoints: 5000,
        level: 5,
        inkcoinsBalance: 2000,
        readingStreak: 50,
      },
    }),
    // Usuario normal
    prisma.user.upsert({
      where: { email: 'user@inkverse.com' },
      update: {},
      create: {
        email: 'user@inkverse.com',
        username: 'otakulvl99',
        displayName: 'Lector Experto',
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.USER,
        xpPoints: 2500,
        level: 3,
        inkcoinsBalance: 500,
        readingStreak: 15,
      },
    }),
    // Novato
    prisma.user.upsert({
      where: { email: 'newbie@inkverse.com' },
      update: {},
      create: {
        email: 'newbie@inkverse.com',
        username: 'manganoob',
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.USER,
        xpPoints: 100,
        level: 1,
        inkcoinsBalance: 50,
        readingStreak: 2,
      },
    }),
  ]);

  console.log(`✅ ${users.length} usuarios creados`);

  // Crear clanes
  // Note: leaderId relation needs to be added to the schema
  const clans = await Promise.all([
    prisma.clan.upsert({
      where: { name: 'Los Otakus Élite' },
      update: {},
      create: {
        name: 'Los Otakus Élite',
        description: 'Clan para lectores apasionados',
        totalScore: 15000,
        monthlyScore: 5000,
        // @ts-ignore - leaderId exists in schema but needs proper relation setup
        leaderId: users[0].id, // admin as leader
      },
    }),
    prisma.clan.upsert({
      where: { name: 'Shonen Squad' },
      update: {},
      create: {
        name: 'Shonen Squad',
        description: 'Amantes del shonen manga',
        totalScore: 8000,
        monthlyScore: 3000,
        // @ts-ignore - leaderId exists in schema but needs proper relation setup
        leaderId: users[1].id, // creator as leader
      },
    }),
  ]);

  console.log(`✅ ${clans.length} clanes creados`);

  // Asignar usuarios a clanes
  await Promise.all([
    // Create memberships individually to handle potential duplicates
    prisma.clanMembership.upsert({
      where: {
        clanId_userId: {
          clanId: clans[0].id,
          userId: users[0].id,
        },
      },
      update: {},
      create: {
        userId: users[0].id, // admin
        clanId: clans[0].id,
        role: 'LEADER',
        contributedScore: 1000,
      },
    }),
    prisma.clanMembership.upsert({
      where: {
        clanId_userId: {
          clanId: clans[0].id,
          userId: users[1].id,
        },
      },
      update: {},
      create: {
        userId: users[1].id, // creator
        clanId: clans[0].id,
        role: 'OFFICER',
        contributedScore: 500,
      },
    }),
    prisma.clanMembership.upsert({
      where: {
        clanId_userId: {
          clanId: clans[1].id,
          userId: users[2].id,
        },
      },
      update: {},
      create: {
        userId: users[2].id, // user
        clanId: clans[1].id,
        role: 'MEMBER',
        contributedScore: 200,
      },
    }),
  ]);

  console.log('✅ Usuarios asignados a clanes');

  // Crear mangas de ejemplo
  const mangas = await Promise.all([
    prisma.mangaSeries.upsert({
      where: { slug: 'shadow-chronicles' },
      update: {},
      create: {
        title: 'Shadow Chronicles',
        slug: 'shadow-chronicles',
        description:
          'En un mundo donde las sombras cobran vida, un joven guerrero debe descubrir su verdadero poder para salvar a su reino. Una épica historia de fantasía oscura creada completamente con IA.',
        authorId: users[1].id,
        authorName: users[1].displayName || users[1].username,
        status: MangaStatus.ONGOING,
        tags: JSON.stringify(['fantasía', 'acción', 'aventura', 'magia', 'oscuro']),
        totalViews: 15000,
        rating: 4.8,
      },
    }),
    prisma.mangaSeries.upsert({
      where: { slug: 'mecha-strikers' },
      update: {},
      create: {
        title: 'Mecha Strikers',
        slug: 'mecha-strikers',
        description:
          'Pilotos adolescentes controlan gigantescos robots para defender la Tierra de una invasión alienígena. Acción, drama y romances prohibidos en cada capítulo.',
        authorId: users[1].id,
        authorName: users[1].displayName || users[1].username,
        status: MangaStatus.ONGOING,
        tags: JSON.stringify(['mecha', 'ciencia ficción', 'acción', 'robots', 'escolar']),
        totalViews: 8000,
        rating: 4.5,
      },
    }),
    prisma.mangaSeries.upsert({
      where: { slug: 'sakura-romance' },
      update: {},
      create: {
        title: 'Sakura Romance',
        slug: 'sakura-romance',
        description:
          'Dos estudiantes de secundaria descubren el amor bajo los cerezos en flor. Una dulce historia de romance escolar que te hará sonreír.',
        authorId: users[1].id,
        authorName: users[1].displayName || users[1].username,
        status: MangaStatus.COMPLETED,
        tags: JSON.stringify(['romance', 'escolar', 'comedia', 'slice of life']),
        totalViews: 12000,
        rating: 4.9,
      },
    }),
    prisma.mangaSeries.upsert({
      where: { slug: 'cyber-detective' },
      update: {},
      create: {
        title: 'Cyber Detective',
        slug: 'cyber-detective',
        description:
          'En el año 2084, un detective cibernético investiga crímenes en la red. Misterio, suspenso y giros inesperados en cada caso.',
        authorId: users[1].id,
        authorName: users[1].displayName || users[1].username,
        status: MangaStatus.ONGOING,
        tags: JSON.stringify(['misterio', 'ciencia ficción', 'suspenso', 'policíaco']),
        totalViews: 5000,
        rating: 4.3,
      },
    }),
  ]);

  console.log(`✅ ${mangas.length} mangas creados`);

  // Crear capítulos
  const chapters = [];
  for (const manga of mangas) {
    const numChapters = manga.status === MangaStatus.COMPLETED ? 10 : 5;

    for (let i = 1; i <= numChapters; i++) {
      chapters.push({
        mangaId: manga.id,
        chapterNumber: i,
        title: `Capítulo ${i}`,
        totalPages: 20 + Math.floor(Math.random() * 10),
        pageUrls: JSON.stringify(Array.from({ length: 25 }, (_, idx) => `/uploads/mock-${manga.id}-${i}-${idx}.jpg`)),
        viewCount: Math.floor(Math.random() * 1000),
      });
    }
  }

  await Promise.all(
    chapters.map((ch) =>
      prisma.chapter.upsert({
        where: { 
          id: `${ch.mangaId}-${ch.chapterNumber}` 
        },
        update: {},
        create: { ...ch, id: `${ch.mangaId}-${ch.chapterNumber}` },
      })
    )
  );

  console.log(`✅ ${chapters.length} capítulos creados`);

  // Crear UserManga (biblioteca de usuarios)
  const userMangas = [
    { userId: users[2].id, mangaId: mangas[0].id, status: ReadingStatus.READING, progress: 3, rating: 5, isFavorite: false },
    { userId: users[2].id, mangaId: mangas[1].id, status: ReadingStatus.READING, progress: 5, rating: 5, isFavorite: true },
    { userId: users[2].id, mangaId: mangas[2].id, status: ReadingStatus.COMPLETED, progress: 10, rating: 5, isFavorite: false },
    { userId: users[3].id, mangaId: mangas[0].id, status: ReadingStatus.PLANNED, progress: 0, isFavorite: false },
  ];

  await Promise.all(
    userMangas.map((um) =>
      prisma.userManga.upsert({
        where: {
          userId_mangaId: {
            userId: um.userId,
            mangaId: um.mangaId,
          },
        },
        update: {},
        create: um,
      })
    )
  );

  console.log('✅ Bibliotecas de usuarios creadas');

  // Crear achievement definitions
  const achievements = [
    { badgeId: 'first_read', name: 'Primeros Pasos', description: 'Lee tu primer capítulo', iconUrl: '📖', xpReward: 50, condition: '{"type":"chapters_read","count":1}' },
    { badgeId: 'bibliophile', name: 'Bibliófilo', description: 'Lee 100 capítulos', iconUrl: '📚', xpReward: 500, condition: '{"type":"chapters_read","count":100}' },
    { badgeId: 'commentator', name: 'Comentarista', description: 'Publica 50 comentarios', iconUrl: '💬', xpReward: 250, condition: '{"type":"comments_posted","count":50}' },
    { badgeId: 'corrector', name: 'Perfeccionista', description: '100 correcciones aprobadas', iconUrl: '✏️', xpReward: 500, condition: '{"type":"corrections_approved","count":100}' },
    { badgeId: 'fanatic', name: 'Fanático', description: 'Marca 20 series como favoritas', iconUrl: '⭐', xpReward: 300, condition: '{"type":"favorites","count":20}' },
    { badgeId: 'streak_7', name: 'Racha de Fuego', description: '7 días consecutivos leyendo', iconUrl: '🔥', xpReward: 100, condition: '{"type":"streak","count":7}' },
    { badgeId: 'creator_first', name: 'Creador', description: 'Sube tu primera serie', iconUrl: '🎨', xpReward: 200, condition: '{"type":"mangas_created","count":1}' },
  ];

  await Promise.all(
    achievements.map((ach) =>
      prisma.achievementDefinition.upsert({
        where: { badgeId: ach.badgeId },
        update: {},
        create: ach,
      })
    )
  );

  // Get the created achievements with their IDs
  const createdAchievements = await prisma.achievementDefinition.findMany({
    where: {
      badgeId: { in: achievements.map((a) => a.badgeId) },
    },
  });

  console.log(`✅ ${createdAchievements.length} logros creados`);

  // Crear algunos logros desbloqueados
  // Use achievement.id (UUID) instead of badgeId
  if (createdAchievements.length >= 6) {
    await prisma.userAchievement.createMany({
      data: [
        { userId: users[2].id, achievementId: createdAchievements[0].id },
        { userId: users[2].id, achievementId: createdAchievements[4].id },
        { userId: users[2].id, achievementId: createdAchievements[5].id },
      ],
    });
  }

  console.log('✅ Logros desbloqueados asignados');

  // Crear transacciones de ejemplo
  await prisma.transaction.createMany({
    data: [
      { userId: users[2].id, amount: 50, type: 'REGISTRATION_BONUS', description: 'Bono de registro' },
      { userId: users[2].id, amount: 10, type: 'CHAPTER_COMPLETE', description: 'Capítulo completado' },
      { userId: users[2].id, amount: 5, type: 'COMMENT_POSTED', description: 'Comentario publicado' },
      { userId: users[2].id, amount: -20, type: 'TIP_SENT', description: 'Propina a autor' },
    ],
  });

  console.log('✅ Transacciones creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\nCredenciales de prueba:');
  console.log('  Admin: admin@inkverse.com / SecurePass123!');
  console.log('  Creador: creator@inkverse.com / SecurePass123!');
  console.log('  Usuario: user@inkverse.com / SecurePass123!');
  console.log('  Novato: newbie@inkverse.com / SecurePass123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
