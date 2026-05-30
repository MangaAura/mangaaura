import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://mangaaura.es';

// Static routes with priorities
const staticRoutes = [
  // Core
  { path: '', priority: 1.0, changefreq: 'daily' },
  { path: '/explore', priority: 0.9, changefreq: 'daily' },
  { path: '/search_ia', priority: 0.9, changefreq: 'daily' },
  { path: '/search_advanced', priority: 0.7, changefreq: 'weekly' },
  { path: '/rankings', priority: 0.8, changefreq: 'daily' },
  { path: '/discover', priority: 0.8, changefreq: 'daily' },
  { path: '/genres', priority: 0.8, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.7, changefreq: 'monthly' },

  // Community
  { path: '/community', priority: 0.7, changefreq: 'daily' },
  { path: '/community/clans', priority: 0.7, changefreq: 'daily' },
  { path: '/community/forum', priority: 0.7, changefreq: 'daily' },
  { path: '/community/rules', priority: 0.4, changefreq: 'monthly' },
  { path: '/social', priority: 0.6, changefreq: 'daily' },

  // Content & features
  { path: '/events', priority: 0.6, changefreq: 'weekly' },
  { path: '/library', priority: 0.8, changefreq: 'weekly' },
  { path: '/notifications', priority: 0.5, changefreq: 'always' },
  { path: '/profile', priority: 0.5, changefreq: 'weekly' },
  { path: '/feed', priority: 0.6, changefreq: 'always' },
  { path: '/reader', priority: 0.6, changefreq: 'weekly' },
  { path: '/prompts', priority: 0.5, changefreq: 'weekly' },
  { path: '/analytics', priority: 0.4, changefreq: 'weekly' },
  { path: '/analytics/signup', priority: 0.3, changefreq: 'monthly' },

  // Creator hub
  { path: '/creator/dashboard', priority: 0.5, changefreq: 'weekly' },
  { path: '/creator/manga', priority: 0.5, changefreq: 'weekly' },
  { path: '/creator/community', priority: 0.4, changefreq: 'weekly' },
  { path: '/creator/settings', priority: 0.3, changefreq: 'monthly' },
  { path: '/creator/sponsors', priority: 0.4, changefreq: 'weekly' },
  { path: '/creator/upload', priority: 0.4, changefreq: 'weekly' },

  // Economy
  { path: '/economy', priority: 0.5, changefreq: 'weekly' },
  { path: '/economy/history', priority: 0.3, changefreq: 'monthly' },
  { path: '/economy/referrals', priority: 0.4, changefreq: 'weekly' },
  { path: '/economy/transfer', priority: 0.3, changefreq: 'monthly' },
  { path: '/economy/withdraw', priority: 0.3, changefreq: 'monthly' },

  // Info pages
  { path: '/announcements', priority: 0.6, changefreq: 'weekly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/news', priority: 0.7, changefreq: 'weekly' },
  { path: '/guias', priority: 0.8, changefreq: 'weekly' },
  { path: '/guias/donde-leer-manga-legal-seguro', priority: 0.7, changefreq: 'monthly' },
  { path: '/guias/mejores-apps-leer-manga', priority: 0.7, changefreq: 'monthly' },
  { path: '/guias/comprar-manga-digital-espana', priority: 0.7, changefreq: 'monthly' },
  { path: '/guias/guia-principiantes-manga', priority: 0.7, changefreq: 'monthly' },
  { path: '/guias/aplicaciones-recomendaciones-personalizadas', priority: 0.7, changefreq: 'monthly' },
  { path: '/guias/manga-mas-vendido-historia', priority: 0.7, changefreq: 'monthly' },

  // Legal & support
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
  { path: '/contacto', priority: 0.5, changefreq: 'monthly' },
  { path: '/help', priority: 0.5, changefreq: 'monthly' },
  { path: '/report', priority: 0.4, changefreq: 'monthly' },
  { path: '/legal/privacy', priority: 0.4, changefreq: 'monthly' },
  { path: '/legal/terms', priority: 0.4, changefreq: 'monthly' },
  { path: '/legal/dmca', priority: 0.3, changefreq: 'monthly' },
  { path: '/comparison', priority: 0.5, changefreq: 'monthly' },
  { path: '/sobre-nosotros', priority: 0.5, changefreq: 'monthly' },

  // Onboarding
  { path: '/welcome', priority: 0.4, changefreq: 'monthly' },
];

// Safe DB query wrapper that suppresses Prisma errors during build
async function safeDbQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error: any) {
    // Check if it's a "table does not exist" error
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      // Silently return fallback - this is expected during first build
      return fallback;
    }
    // Log other unexpected errors
    console.error('Database query error:', error?.message || error);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Add static routes
  for (const route of staticRoutes) {
    routes.push({
      url: `${BASE_URL}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changefreq as 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
      priority: route.priority,
    });
  }

  // Get all mangas - with safe error handling
  const mangas = await safeDbQuery(
    () =>
      prisma.mangaSeries.findMany({
        select: {
          slug: true,
          updatedAt: true,
          chapters: {
            select: { id: true, chapterNumber: true, updatedAt: true },
            orderBy: { chapterNumber: 'desc' },
            take: 5,
          },
        },
        where: {
          status: { not: 'CANCELLED' },
        },
      }),
    []
  );

  // Add manga pages
  for (const manga of mangas) {
    routes.push({
      url: `${BASE_URL}/manga/${manga.slug}`,
      lastModified: manga.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Add chapter pages
    for (const chapter of manga.chapters) {
      routes.push({
        url: `${BASE_URL}/manga/${manga.slug}/chapter/${chapter.chapterNumber}`,
        lastModified: chapter.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      });

      // Add reader URL (clean format)
      routes.push({
        url: `${BASE_URL}/${manga.slug}-${chapter.chapterNumber}`,
        lastModified: chapter.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  // Get public collections - with safe error handling
  const collections = await safeDbQuery(
    () =>
      prisma.collection.findMany({
        where: { isPublic: true },
        select: { id: true, updatedAt: true },
        take: 100,
      }),
    []
  );

  for (const collection of collections) {
    routes.push({
      url: `${BASE_URL}/collections/${collection.id}`,
      lastModified: collection.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  // Get active clans - with safe error handling
  const clans = await safeDbQuery(
    () =>
      prisma.clan.findMany({
        select: { slug: true, updatedAt: true },
        take: 50,
      }),
    []
  );

  for (const clan of clans) {
    routes.push({
      url: `${BASE_URL}/community/clan/${clan.slug}`,
      lastModified: clan.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  }

  // Get blog posts (NewsArticle model) - with safe error handling
  const articles = await safeDbQuery(
    () =>
      prisma.newsArticle.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        take: 200,
      }),
    []
  );

  for (const article of articles) {
    routes.push({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Get genres - with safe error handling
  const genres = await safeDbQuery(
    () =>
      prisma.genre.findMany({
        select: { slug: true, updatedAt: true },
      }),
    []
  );

  for (const genre of genres) {
    routes.push({
      url: `${BASE_URL}/genres/${genre.slug}`,
      lastModified: genre.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Get forum threads - with safe error handling
  const threads = await safeDbQuery(
    () =>
      prisma.forumThread.findMany({
        select: { slug: true, updatedAt: true },
        take: 200,
      }),
    []
  );

  for (const thread of threads) {
    routes.push({
      url: `${BASE_URL}/community/forum/${thread.slug}`,
      lastModified: thread.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  }

  // Get active announcements - with safe error handling
  const announcements = await safeDbQuery(
    () =>
      prisma.announcement.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        take: 50,
      }),
    []
  );

  for (const announcement of announcements) {
    routes.push({
      url: `${BASE_URL}/announcements`,
      lastModified: announcement.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return routes;
}

