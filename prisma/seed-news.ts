/**
 * Seed de noticias (NewsArticle) para MangaAura
 * Migra los artículos estáticos definidos en src/lib/news.ts a la base de datos.
 *
 * Uso: npx tsx prisma/seed-news.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Artículos estáticos migrados con sus textos en inglés resueltos
 * (los translation keys se resolvieron manualmente desde src/i18n/locales/en.json)
 */
interface ArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  coverUrl: string;
}

const staticArticles: ArticleSeed[] = [
  {
    title: 'Clan Season 3 is Here!',
    slug: 'clan-season-3',
    excerpt:
      'Gather your guild and prepare for the new battle for Aura. New rewards added to the pool.',
    content:
      'Clan Season 3 has officially launched! Gather your guild members and prepare for epic battles. This season brings new Aura rewards, exclusive badges, and a revamped matchmaking system. Complete daily missions, climb the leaderboard, and prove your clan\'s worth. New rewards have been added to the prize pool including rare avatar frames and limited-time cosmetics. The season runs until August 15th, so start earning those points now!',
    category: 'community',
    date: '2026-05-15',
    coverUrl:
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1b8a?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'New Paged Reader Mode',
    slug: 'paged-reader',
    excerpt:
      'Based on your feedback, we\'ve refined the page-by-page reading system for lower RAM usage on mobile.',
    content:
      'Based on your valuable feedback, we\'ve completely overhauled our page-by-page reading system. The new Paged Reader Mode consumes significantly less RAM on mobile devices, delivers faster page transitions, and includes a customizable reading experience. You can now adjust brightness, background color, and font size to your preference. Vertical scrolling and horizontal paging are both supported. Try it out on any manga and let us know what you think!',
    category: 'platform',
    date: '2026-05-10',
    coverUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'New AI Artist Tools',
    slug: 'ai-tools',
    excerpt:
      'Powerful new generation and editing tools for creators. Take your manga to the next level.',
    content:
      'We\'re excited to announce a major update to our AI creation tools. The new suite includes enhanced character generation with better consistency, improved background scene creation, and an advanced inpainting tool for fine-tuning your panels. Our AI now better understands manga art styles and can assist with screentone patterns, speed lines, and effect backgrounds. These tools are available to all creators on MangaAura. Upgrade your workflow and bring your stories to life!',
    category: 'platform',
    date: '2026-05-05',
    coverUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Mobile App Beta',
    slug: 'mobile-beta',
    excerpt:
      'Closed beta of MangaAura for iOS and Android is now available. Optimized mobile experience.',
    content:
      'The closed beta for our mobile app is now available for iOS and Android users! Experience MangaAura optimized for your phone with a native interface, smooth scrolling, and offline reading support. The beta includes access to your library, the reader, and community features. To join the beta, check your inbox for an invitation or sign up on the waitlist. We\'re looking forward to your feedback to make the mobile experience even better before the public release.',
    category: 'platform',
    date: '2026-04-28',
    coverUrl:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'MangaAura Manga Contest',
    slug: 'manga-contest',
    excerpt:
      'Join our monthly manga contest and win Aura, exposure, and exclusive badges.',
    content:
      'Our monthly manga contest is back with bigger prizes than ever! This month\'s theme is \'Parallel Worlds\' — create a one-shot manga exploring alternate dimensions. The winner receives 5000 Aura, a featured spot on the homepage, an exclusive \'Contest Winner\' badge, and direct feedback from our editorial team. Submissions are open until the end of the month. All genres and styles are welcome. Let your imagination run wild!',
    category: 'community',
    date: '2026-04-20',
    coverUrl:
      'https://images.unsplash.com/photo-1529111290557-82f6d5b59a2a?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'New Reading Stats Dashboard',
    slug: 'reading-stats',
    excerpt:
      'Track your reading habits, set goals, and discover your most-read genres with our new personalized statistics dashboard.',
    content:
      'We\'re excited to introduce the Reading Stats Dashboard — your personal reading companion! Now you can track every chapter you read, visualize your reading habits over time, and discover fascinating insights about your manga journey.\n\nThe dashboard displays your total chapters read, reading streaks, favorite genres, and hourly reading patterns. Set weekly reading goals and earn badges for hitting milestones. Compare your stats with friends and see who\'s the most dedicated reader in your clan.\n\nAccess your dashboard from your profile page or by clicking the new \'Stats\' button in the reader. Your data is private by default, but you can choose to share selected stats with your clan or followers. Start tracking today and see how deep your manga addiction runs!',
    category: 'community',
    date: '2026-04-15',
    coverUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Creator Spotlight: Rising Stars',
    slug: 'creator-spotlight',
    excerpt:
      'Meet the creators who have captured the community\'s heart this month with their exceptional stories and art.',
    content:
      'Every month we shine a light on the talented creators who make MangaAura special. This May, we\'re featuring three rising stars whose work has garnered exceptional engagement from the community.\n\nFirst up is SakuraManga with \'Whispers of the Moon\' — a hauntingly beautiful romance set in feudal Japan that has readers hooked with its intricate panelling and emotional depth. With over 50,000 reads in its first month, this series is one to watch.\n\nNext, we have PixelNinja whose action epic \'Neon Dragons\' blends cyberpunk aesthetics with classic martial arts storytelling. The dynamic fight choreography and vibrant color palette have earned it a dedicated fanbase that grows daily.\n\nFinally, meet ArtWanderer, a creator who joined MangaAura just three months ago and has already published 4 complete chapters of \'The Clockwork Garden,\' a steampunk fantasy adventure with gorgeous line art and a richly imagined world.\n\nCongratulations to all our featured creators! Want to be featured next month? Keep creating, engaging with your readers, and pushing the boundaries of your art.',
    category: 'community',
    date: '2026-04-08',
    coverUrl:
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Developer API Now Available',
    slug: 'developer-api',
    excerpt:
      'Build integrations, create bots, and extend MangaAura with our official REST API now in open beta for all verified creators.',
    content:
      'We\'re thrilled to announce the open beta of the MangaAura Developer API — your gateway to building custom integrations and extending the platform\'s capabilities.\n\nThe API provides programmatic access to manga metadata, chapter listings, user profiles (with consent), and community features. Build a Discord bot that notifies your server about new chapter releases, create a reading tracker widget for your personal website, or develop a third-party client with your own reading interface.\n\nAPI keys are available to all verified creators through the Developer Settings page. We provide comprehensive documentation with code examples in JavaScript, Python, and curl. Each key comes with generous rate limits and detailed usage analytics.\n\nWe\'re actively iterating on the API based on developer feedback, so join our Developer Discord channel to share your use cases and suggestions. The API is free during beta, with pricing tiers to be announced at full launch.',
    category: 'platform',
    date: '2026-03-25',
    coverUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Site-wide UI Refresh',
    slug: 'ui-redesign',
    excerpt:
      'A polished, faster, and more consistent visual experience across the entire platform — here\'s what changed and why.',
    content:
      'You may have noticed things look a bit different! We\'ve rolled out a comprehensive UI refresh across MangaAura to make the platform more intuitive, visually cohesive, and performant.\n\nThe refresh includes updated typography with better readability, refined color palettes for improved contrast and accessibility, smoother transitions and micro-interactions, and a redesigned navigation system that surfaces your most-used features faster.\n\nWe standardized card components across the site for visual consistency, reduced visual clutter in the reader interface, and added subtle animations that make browsing feel more responsive. The mobile experience has also been significantly improved with larger touch targets and optimized layouts.\n\nThis update is the result of months of user feedback and usability testing. We\'ll continue to refine based on your input — drop us a line through the feedback form if you spot anything that could be improved!',
    category: 'platform',
    date: '2026-03-15',
    coverUrl:
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Major Performance Boost',
    slug: 'performance-boost',
    excerpt:
      'Page loads are now 40% faster, data usage reduced by 60% on mobile, and server response times cut in half.',
    content:
      'Performance has always been a top priority, and we\'re proud to announce our biggest infrastructure update yet. Over the past month, our engineering team has been hard at work optimizing every layer of the stack.\n\nKey improvements include: a complete rewrite of our image delivery pipeline with next-gen formats and intelligent compression, implementation of edge caching across our global CDN that serves 80% of requests from cache, database query optimization that reduced average page load times by 40%, and a new lazy-loading strategy for the reader that cuts initial data transfer by 60%.\n\nMobile users will notice the biggest difference — pages load in under 2 seconds even on slower connections, and the reader consumes significantly less bandwidth per chapter. We\'ve also reduced our server response times by over 50%, making the entire platform feel snappier.\n\nThese improvements are live now across all regions. Let us know how the new performance feels for you!',
    category: 'platform',
    date: '2026-03-05',
    coverUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop&auto=format',
  },
  {
    title: 'Summer Reading Festival',
    slug: 'summer-event',
    excerpt:
      'Join the Summer Reading Festival with exclusive badges, double XP weekends, and a grand prize of 10,000 Aura!',
    content:
      'Summer is here and so is our biggest community event of the year — the MangaAura Summer Reading Festival! From June 1st to August 31st, readers and creators alike can participate in a season-long celebration of manga.\n\nWhat\'s in store? Double XP weekends every month, exclusive Summer Festival badges for participants who complete the reading challenges, daily login rewards including free Aura and cosmetic items, and a grand prize of 10,000 Aura awarded to the reader with the most chapters completed by the end of summer.\n\nCreators aren\'t left out either — we\'re hosting a \'Summer Special\' one-shot contest with separate prizes. Publish a summer-themed chapter between June and August and you could win 5,000 Aura plus a permanent featured spot on the homepage.\n\nThe festival also features weekly community events, creator Q&A sessions, and collaborative reading parties. Check the Events page for the full calendar and start your summer reading journey today! Screenshot your reading stats and share with #MangaAuraSummer for a chance to be featured on our social media.',
    category: 'community',
    date: '2026-02-20',
    coverUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=225&fit=crop&auto=format',
  },
];

async function seedNews() {
  console.log('📰 Sembrando noticias...');

  // Buscar un admin para asignar como autor
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!admin) {
    console.error(
      '❌ No se encontró ningún usuario admin. ' +
        'Ejecuta primero `npx tsx prisma/seed.ts` para crear usuarios de prueba.',
    );
    process.exit(1);
  }

  console.log(`✅ Admin encontrado: ${admin.id}`);

  let created = 0;
  let skipped = 0;

  for (const article of staticArticles) {
    const publishedAt = new Date(article.date + 'T12:00:00Z');

    const existing = await prisma.newsArticle.findUnique({
      where: { slug: article.slug },
      select: { id: true },
    });

    if (existing) {
      console.log(`⏭️  Ya existe: "${article.title}" (slug: ${article.slug})`);
      skipped++;
      continue;
    }

    await prisma.newsArticle.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        coverUrl: article.coverUrl,
        category: article.category,
        authorId: admin.id,
        isPublished: true,
        publishedAt,
      },
    });

    console.log(`✅ Creada: "${article.title}" (${article.date})`);
    created++;
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Creadas: ${created}`);
  console.log(`   Saltadas (ya existían): ${skipped}`);
  console.log(`   Total: ${staticArticles.length}`);
  console.log('✨ Seed de noticias completado');
}

seedNews()
  .catch((e) => {
    console.error('❌ Error sembrando noticias:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
