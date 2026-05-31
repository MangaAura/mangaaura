import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://mangaaura.es';

// Safe DB query wrapper that suppresses Prisma errors during build
async function safeDbQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return fallback;
    }
    console.error('Database query error:', error?.message || error);
    return fallback;
  }
}

export default async function newsSitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Get published news articles from the last 48 hours for Google News
  // Only include articles with explicit publishedAt dates
  const articles = await safeDbQuery(
    () =>
      prisma.newsArticle.findMany({
        where: {
          isPublished: true,
          publishedAt: { not: null },
          // Google News requires articles from last 48 hours
          // We include all published articles but mark recent ones with higher priority
        },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          updatedAt: true,
          coverUrl: true,
          category: true,
          author: {
            select: { username: true, displayName: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      }),
    []
  );

  for (const article of articles) {
    if (!article.publishedAt) continue;

    const pubDate = article.publishedAt.toISOString().split('T')[0];
    const [year, month] = pubDate.split('-');
    const canonical = `/news/${year}/${month}/${article.slug}`;
    const ageInDays = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    routes.push({
      url: `${BASE_URL}${canonical}`,
      lastModified: article.updatedAt || article.publishedAt,
      changeFrequency: ageInDays <= 2 ? 'daily' : 'monthly',
      priority: ageInDays <= 2 ? 1.0 : 0.5,
    });
  }

  return routes;
}
