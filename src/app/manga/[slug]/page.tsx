import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import MangaDetailClient from './MangaDetailClient';
import { MangaStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

interface MangaPageProps {
  params: Promise<{ slug: string }>;
}

async function getMangaData(slug: string) {
  const manga = await prisma.mangaSeries.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { chapterNumber: 'desc' },
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
    },
  });

  if (!manga) return null;

  const totalViews = manga.chapters.reduce((sum: number, ch: any) => sum + ch.viewCount, 0);
  const tags = JSON.parse(manga.tags || '[]') as string[];

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
    rating: manga.rating,
    totalViews: totalViews + manga.totalViews,
    createdAt: manga.createdAt,
    updatedAt: manga.updatedAt,
    chapters: manga.chapters,
    libraryCount: manga.libraryEntries.length,
  };
}

export async function generateMetadata({ params }: MangaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await detectLocale();
  const t = getT(locale);
  const manga = await getMangaData(slug);

  if (!manga) {
    return { title: `${t('page.mangaNotFound.title')} | MangaAura` };
  }
  const title = `${manga.title} | MangaAura`;
  const description = manga.description?.slice(0, 160) || t('page.mangaDetail.description', { title: manga.title, count: manga.chapters.length });
  const keywords = manga.tags?.join(', ') || '';
  const ogImage = manga.coverUrl
    ? `/api/og?type=manga&title=${encodeURIComponent(manga.title)}&author=${encodeURIComponent(manga.authorName)}&cover=${encodeURIComponent(manga.coverUrl)}${manga.rating ? `&rating=${manga.rating}` : ''}&chapters=${manga.chapters.length}`
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
      publishedTime: manga.createdAt?.toISOString(),
      modifiedTime: manga.updatedAt?.toISOString(),
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
  const manga = await getMangaData(slug);

  if (!manga) {
    notFound();
  }

  const session = await auth();
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
        totalChapters={manga.chapters.length}
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
