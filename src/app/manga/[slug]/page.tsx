import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import MangaDetailClient from './MangaDetailClient';
import { MangaStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withCache, cacheConfig, generateCacheKey } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface MangaPageProps {
  params: Promise<{ slug: string }>;
}

interface MangaTagData {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  description: string | null;
}

interface MangaData {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  authorId: string;
  authorName: string | null;
  status: string;
  tags: string[];
  systemTags: MangaTagData[];
  rating: number | null;
  totalViews: number;
  createdAt: Date;
  updatedAt: Date;
  chapters: {
    id: string;
    chapterNumber: number;
    title: string | null;
    coverUrl: string | null;
    totalPages: number;
    viewCount: number;
    createdAt: Date;
  }[];
  totalChapterCount: number;
  libraryCount: number;
}

const getMangaData = cache(async (slug: string): Promise<MangaData | null> => {
  const cacheKey = generateCacheKey('manga:detail', { slug });

  return withCache<MangaData | null>(
    cacheKey,
    cacheConfig.manga.detail.ttl,
    async () => {
      const manga = await prisma.mangaSeries.findUnique({
        where: { slug },
        include: {
          chapters: {
            orderBy: { chapterNumber: 'desc' },
            take: 50,
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              coverUrl: true,
              totalPages: true,
              viewCount: true,
              createdAt: true,
            },
          },
          libraryEntries: {
            select: { id: true },
          },
          mangaTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  color: true,
                  description: true,
                },
              },
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
      });

      if (!manga) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalViews = manga.chapters.reduce((sum: number, ch: any) => sum + ch.viewCount, 0);
      const tags = JSON.parse(manga.tags || '[]') as string[];
      const systemTags = manga.mangaTags.map((mt) => ({
        id: mt.tag.id,
        slug: mt.tag.slug,
        name: mt.tag.name,
        color: mt.tag.color,
        description: mt.tag.description,
      }));

      return {
        id: manga.id,
        title: manga.title,
        slug: manga.slug,
        description: manga.description || '',
        coverUrl: manga.coverUrl,
        authorId: manga.authorId,
        authorName: manga.authorName,
        status: manga.status,
        tags,
        systemTags,
        rating: manga.rating,
        totalViews: totalViews + manga.totalViews,
        createdAt: manga.createdAt,
        updatedAt: manga.updatedAt,
        chapters: manga.chapters,
        totalChapterCount: manga._count.chapters,
        libraryCount: manga.libraryEntries.length,
      };
    },
  );
});

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await detectLocale();
  const t = getT(locale);
  const manga = await getMangaData(slug);

  if (!manga) {
    return { title: `${t('page.mangaNotFound.title')} | MangaAura` };
  }

  const title = `${manga.title} | MangaAura`;
  // Use the real total chapter count (not limited by take: 50) for SEO accuracy
  const description = manga.description?.slice(0, 160) || t('page.mangaDetail.description', { title: manga.title, count: manga.totalChapterCount });
  const keywords = manga.tags?.join(', ') || '';
  const ogImage = manga.coverUrl
    ? `/api/og?type=manga&title=${encodeURIComponent(manga.title)}&author=${encodeURIComponent(manga.authorName ?? '')}&cover=${encodeURIComponent(manga.coverUrl)}${manga.rating ? `&rating=${manga.rating}` : ''}&chapters=${manga.totalChapterCount}`
    : undefined;

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: `/manga/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      siteName: 'MangaAura',
      url: `/manga/${slug}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: manga.title }] : undefined,
      // createdAt/updatedAt can be Date (fresh query) or string (from Redis cache).
      // JSON.stringify converts Date to ISO strings, so handle both safely.
      publishedTime: manga.createdAt ? new Date(manga.createdAt).toISOString() : undefined,
      modifiedTime: manga.updatedAt ? new Date(manga.updatedAt).toISOString() : undefined,
      tags: manga.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    category: 'Manga',
  };
}

export default async function MangaDetailPage({ params }: MangaPageProps) {
  const { slug } = await params;

  // Run auth and manga data fetching in parallel
  const [manga, session] = await Promise.all([
    getMangaData(slug),
    auth(),
  ]);

  if (!manga) {
    notFound();
  }

  const userId = session?.user?.id || null;

  let libraryStatus: string | null = null;
  if (userId) {
    const entry = await prisma.userLibrary.findUnique({
      where: {
        userId_mangaId: { userId, mangaId: manga.id },
      },
    });
    libraryStatus = entry?.status || null;
  }

  return (
    <>
      <MangaStructuredData
        title={manga.title}
        description={manga.description}
        author={manga.authorName}
        coverUrl={manga.coverUrl || undefined}
        slug={manga.slug}
        rating={manga.rating || undefined}
        tags={manga.tags}
        totalChapters={manga.totalChapterCount}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Manga', item: '/explore' },
          { name: manga.title, item: `/manga/${manga.slug}` },
        ]}
      />
      <MangaDetailClient manga={manga} libraryStatus={libraryStatus} userId={userId} />
    </>
  );
}
