import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { dbArticleToDisplayItem } from '@/lib/news';
import { NewsArticleClient } from './NewsArticleClient';

interface Props {
  params: Promise<{ year: string; month: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const dbArticle = await prisma.newsArticle.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, slug: true, publishedAt: true },
  });

  if (dbArticle) {
    const pubDate = dbArticle.publishedAt?.toISOString().split('T')[0] || '';
    const [y, m] = pubDate.split('-');
    return {
      title: `${dbArticle.title} | InkVerse`,
      alternates: {
        canonical: y && m ? `/news/${y}/${m}/${dbArticle.slug}` : `/news/${dbArticle.slug}`,
      },
    };
  }

  return { title: 'Noticia no encontrada | InkVerse' };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;

  const dbArticle = await prisma.newsArticle.findUnique({
    where: { slug, isPublished: true },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!dbArticle) notFound();

  const displayItem = dbArticleToDisplayItem(dbArticle);
  return <NewsArticleClient article={displayItem} />;
}
