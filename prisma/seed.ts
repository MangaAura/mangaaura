import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

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
      where: { email: 'admin@mangaaura.es' },
      update: {},
      create: {
        email: 'admin@mangaaura.es',
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
      where: { email: 'creator@mangaaura.es' },
      update: {},
      create: {
        email: 'creator@mangaaura.es',
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
      where: { email: 'user@mangaaura.es' },
      update: {},
      create: {
        email: 'user@mangaaura.es',
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
      where: { email: 'newbie@mangaaura.es' },
      update: {},
      create: {
        email: 'newbie@mangaaura.es',
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

  // Crear achievement definitions (imported from seed-achievements)
  const { achievements: achievementDefs } = await import('./seed-achievements');

  await Promise.all(
    achievementDefs.map((ach) =>
      prisma.achievementDefinition.upsert({
        where: { badgeId: ach.badgeId },
        update: {
          name: ach.name,
          description: ach.description,
          xpReward: ach.xpReward,
          iconUrl: ach.iconUrl,
          condition: JSON.stringify(ach.condition),
          category: ach.category,
          difficulty: ach.difficulty,
        },
        create: {
          badgeId: ach.badgeId,
          name: ach.name,
          description: ach.description,
          xpReward: ach.xpReward,
          iconUrl: ach.iconUrl,
          condition: JSON.stringify(ach.condition),
          category: ach.category,
          difficulty: ach.difficulty,
        },
      })
    )
  );

  console.log('✅ Logros creados');

  // Get the created achievements with their IDs
  const createdAchievements = await prisma.achievementDefinition.findMany({
    where: {
      badgeId: { in: achievementDefs.map((a) => a.badgeId) },
    },
  });

  console.log(`✅ ${createdAchievements.length} logros creados`);

  // Crear algunos logros desbloqueados
  // Use achievement.id (UUID) instead of badgeId
  if (createdAchievements.length >= 6) {
    for (const achievement of [createdAchievements[0], createdAchievements[4], createdAchievements[5]]) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: users[2].id,
            achievementId: achievement.id,
          },
        },
        update: {},
        create: {
          userId: users[2].id,
          achievementId: achievement.id,
        },
      });
    }
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

  // Crear categorías del foro
  const forumCategories = await Promise.all([
    prisma.forumCategory.upsert({
      where: { slug: 'general' },
      update: {},
      create: { name: 'General', slug: 'general', description: 'Conversaciones generales sobre creación de manga', icon: 'MessageSquare', order: 0 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'techniques' },
      update: {},
      create: { name: 'Técnicas', slug: 'techniques', description: 'Técnicas de dibujo, composición y narrativa visual', icon: 'Palette', order: 1 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'prompts' },
      update: {},
      create: { name: 'Prompts IA', slug: 'prompts', description: 'Comparte y discute prompts para generación de imágenes', icon: 'Lightbulb', order: 2 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'publishing' },
      update: {},
      create: { name: 'Publicación', slug: 'publishing', description: 'Dudas y consejos sobre publicación de capítulos', icon: 'BookOpen', order: 3 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'growth' },
      update: {},
      create: { name: 'Crecimiento', slug: 'growth', description: 'Estrategias para conseguir lectores y crecer en la plataforma', icon: 'TrendingUp', order: 4 },
    }),
    prisma.forumCategory.upsert({
      where: { slug: 'announcements' },
      update: {},
      create: { name: 'Anuncios', slug: 'announcements', description: 'Novedades y anuncios oficiales de MangaAura', icon: 'Megaphone', order: 5 },
    }),
  ]);

  console.log(`✅ ${forumCategories.length} categorías del foro creadas`);

  // Crear hilos de ejemplo
  const forumThreads = [
    {
      title: 'Guía de mejores prácticas para subida de capítulos',
      slug: 'guia-mejores-practicas-subida',
      content: 'Recomendaciones para optimizar la calidad y tamaño de tus imágenes al subir capítulos. Asegúrate de usar resolución 1200x1800 para páginas estándar y comprimir a webp para mejor rendimiento.',
      isPinned: true,
      categoryId: forumCategories[5].id,
      authorId: users[0].id,
      tags: JSON.stringify(['guía', 'publicación']),
    },
    {
      title: 'Compartiendo mis prompts para estilo shōnen',
      slug: 'prompts-estilo-shonen',
      content: 'Después de experimentar mucho, encontré una combinación de prompts que da un estilo shōnen clásico. El truco está en especificar "dynamic action poses, bold ink lines, dramatic shading" seguido del estilo del artista de referencia.',
      isPinned: true,
      categoryId: forumCategories[2].id,
      authorId: users[1].id,
      tags: JSON.stringify(['prompts', 'shonen', 'tips']),
    },
    {
      title: '¿Cómo mejoráis la consistencia de personajes entre capítulos?',
      slug: 'consistencia-personajes-entre-capitulos',
      content: 'Tengo problemas para que mis personajes se vean consistentes entre páginas. ¿Qué técnicas usáis? He probado con character sheets pero sigo teniendo variaciones.',
      isPinned: false,
      categoryId: forumCategories[1].id,
      authorId: users[1].id,
      tags: JSON.stringify(['consistencia', 'personajes']),
    },
    {
      title: 'Estrategias para conseguir más lectores',
      slug: 'estrategias-conseguir-lectores',
      content: 'He notado que ciertos horarios de publicación funcionan mejor. Publicar entre las 18:00-21:00 CET me da un 40% más de visitas. Comparto mi experiencia y quiero saber la vuestra.',
      isPinned: false,
      categoryId: forumCategories[4].id,
      authorId: users[1].id,
      tags: JSON.stringify(['crecimiento', 'horarios', 'tips']),
    },
    {
      title: 'Nuevo sistema de crowdfunding: preguntas y respuestas',
      slug: 'crowdfunding-preguntas-respuestas',
      content: 'Respondemos las preguntas más frecuentes sobre el nuevo sistema de financiamiento colectivo. Ahora los lectores pueden contribuir InkCoins para apoyar la creación de nuevos capítulos.',
      isPinned: false,
      categoryId: forumCategories[5].id,
      authorId: users[0].id,
      tags: JSON.stringify(['crowdfunding', 'faq', 'inkcoins']),
    },
  ];

  for (const thread of forumThreads) {
    await prisma.forumThread.upsert({
      where: { slug: thread.slug },
      update: {},
      create: thread,
    });
  }

  console.log(`✅ ${forumThreads.length} hilos del foro creados`);

  // ── Events ──
  console.log('\n📅 Creando eventos...');

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const events = [
    {
      title: 'Desafío de Fan-Art: "Perdido en el Cosmos"',
      description: 'La plataforma lanza el prompt base del mes. Tu misión: generar una obra que muestre a un protagonista de anime perdido en el espacio exterior, con una estética visual retro-futurista.',
      type: 'ART_CHALLENGE',
      basePrompt: 'An anime protagonist floating alone in deep space, retro-futuristic aesthetic, starfield background, melancholic expression, Makoto Shinkai style, cinematic, award winning digital art --ar 16:9 --niji 6',
      prize: '5,000 InkCoins + Banner Exclusivo',
      startDate: oneWeekAgo,
      endDate: in7Days,
      status: 'ACTIVE',
      participants: 43,
      color: 'from-[var(--accent-blue)]/40 to-[var(--accent-purple)]/40',
      borderColor: 'border-accent-blue/30',
      createdBy: users[0].id,
    },
    {
      title: 'Torneo de Speedreading: Semana Shounen',
      description: 'Lee la mayor cantidad de capítulos de mangas de género Shounen en 7 días. Los 3 usuarios con más capítulos completados ganan el podio de esta semana.',
      type: 'SPEEDREADING',
      basePrompt: null,
      prize: '3,000 / 1,500 / 750 InkCoins',
      startDate: oneWeekAgo,
      endDate: in3Days,
      status: 'ACTIVE',
      participants: 218,
      color: 'from-[var(--accent-red)]/40 to-[var(--accent-orange)]/40',
      borderColor: 'border-accent-red/30',
      createdBy: users[0].id,
    },
    {
      title: 'Votación: "Ciudad Neon del Futuro"',
      description: 'Vota por tu obra favorita del desafío anterior. La obra más votada gana 3,000 InkCoins y un banner exclusivo.',
      type: 'ART_CHALLENGE',
      basePrompt: 'A futuristic neon city at night, cyberpunk aesthetic, anime style, rain-soaked streets, holographic advertisements, towering skyscrapers --ar 16:9 --niji 6',
      prize: '3,000 InkCoins + Banner Exclusivo',
      startDate: twoWeeksAgo,
      endDate: oneWeekAgo,
      status: 'VOTING',
      participants: 56,
      color: 'from-[var(--accent-purple)]/40 to-[var(--accent-red)]/40',
      borderColor: 'border-accent-purple/30',
      createdBy: users[0].id,
    },
    {
      title: 'Desafío: "El Último Héroe"',
      description: 'Un héroe caído en el campo de batalla, su última mirada al cielo. La comunidad generó arte épico inspirado en este prompt.',
      type: 'ART_CHALLENGE',
      basePrompt: 'A fallen hero on the battlefield, last look at the sky, epic anime style, dramatic lighting, golden hour --ar 16:9 --niji 6',
      prize: '4,000 InkCoins',
      startDate: twoMonthsAgo,
      endDate: oneMonthAgo,
      status: 'COMPLETED',
      participants: 67,
      createdBy: users[0].id,
    },
  ];

  const createdEvents: any[] = [];
  for (const event of events) {
    const created = await prisma.event.create({ data: event });
    createdEvents.push(created);
  }

  if (createdEvents.length >= 3) {
    const votingEvent = createdEvents[2];
    const votingSubmissions = [
      { eventId: votingEvent.id, userId: users[1].id, imageUrl: '/placeholder-manga.svg', prompt: 'An anime hero in deep space retro-futuristic --niji 6', votes: 142 },
      { eventId: votingEvent.id, userId: users[2].id, imageUrl: '/placeholder-manga.svg', prompt: 'Floating astronaut anime girl retro style --v 6', votes: 98 },
      { eventId: votingEvent.id, userId: users[3].id, imageUrl: '/placeholder-manga.svg', prompt: 'Lonely protagonist cosmos cinematic --ar 16:9 --niji 6', votes: 87 },
      { eventId: votingEvent.id, userId: users[0].id, imageUrl: '/placeholder-manga.svg', prompt: 'Space opera anime protagonist --midjourney', votes: 54 },
    ];
    for (const sub of votingSubmissions) {
      await prisma.eventSubmission.create({ data: sub });
    }
  }

  console.log(`✅ ${createdEvents.length} eventos creados`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\nCredenciales de prueba:');
  console.log('  Admin: admin@mangaaura.es / SecurePass123!');
  console.log('  Creador: creator@mangaaura.es / SecurePass123!');
  console.log('  Usuario: user@mangaaura.es / SecurePass123!');
  console.log('  Novato: newbie@mangaaura.es / SecurePass123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
