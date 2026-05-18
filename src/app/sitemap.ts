import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://inkverse.app';

// Static routes with priorities
const staticRoutes = [
  { path: '', priority: 1.0, changefreq: 'daily' },
  { path: '/browse', priority: 0.9, changefreq: 'daily' },
  { path: '/search', priority: 0.9, changefreq: 'daily' },
  { path: '/rankings', priority: 0.8, changefreq: 'daily' },
  { path: '/library', priority: 0.8, changefreq: 'weekly' },
  { path: '/community/clans', priority: 0.7, changefreq: 'daily' },
  { path: '/events', priority: 0.6, changefreq: 'weekly' },
  { path: '/notifications', priority: 0.5, changefreq: 'always' },
  { path: '/profile', priority: 0.5, changefreq: 'weekly' },
  { path: '/creator/dashboard', priority: 0.5, changefreq: 'weekly' },
  { path: '/achievements', priority: 0.6, changefreq: 'weekly' },
  { path: '/feed', priority: 0.6, changefreq: 'always' },
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

      // Add reader URL
      routes.push({
        url: `${BASE_URL}/reader/${manga.slug}?chapter=${chapter.chapterNumber}`,
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
        select: { id: true, updatedAt: true },
        take: 50,
      }),
    []
  );

  for (const clan of clans) {
    routes.push({
      url: `${BASE_URL}/community/clan/${clan.id}`,
      lastModified: clan.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  }

  return routes;
}

