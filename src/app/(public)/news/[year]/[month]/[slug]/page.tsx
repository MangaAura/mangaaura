import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleStructuredData } from '@/components/SEO/StructuredData';
import { NewsArticleClient } from './NewsArticleClient';
import { dbArticleToDisplayItem } from '@/lib/news';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ year: string; month: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const dbArticle = await prisma.newsArticle.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true, updatedAt: true },
  });

  if (dbArticle) {
    const pubDate = dbArticle.publishedAt?.toISOString().split('T')[0] || '';
    const [y, m] = pubDate.split('-');
    const canonical = y && m ? `/news/${y}/${m}/${dbArticle.slug}` : `/news/${dbArticle.slug}`;
    const description = dbArticle.excerpt?.slice(0, 160) || `Lee ${dbArticle.title} en MangaAura.`;

    const ogImage = `/api/og?type=news&title=${encodeURIComponent(dbArticle.title)}&cover=${dbArticle.coverUrl ? encodeURIComponent(dbArticle.coverUrl) : ''}`;

    return {
      title: `${dbArticle.title} | MangaAura`,
      description,
      openGraph: {
        title: `${dbArticle.title} | MangaAura`,
        description,
        type: 'article',
        images: [{ url: ogImage, width: 1200, height: 630, alt: dbArticle.title }],
        publishedTime: dbArticle.publishedAt?.toISOString(),
        modifiedTime: dbArticle.updatedAt?.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${dbArticle.title} | MangaAura`,
        description,
        images: [ogImage],
      },
      alternates: { canonical },
    };
  }

  return { title: 'Noticia no encontrada | MangaAura' };
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
  const canonical = `/news/${displayItem.date.split('-')[0]}/${displayItem.date.split('-')[1]}/${displayItem.slug}`;

  return (
    <>
      <ArticleStructuredData
        title={`${displayItem.title} | MangaAura`}
        description={displayItem.description}
        url={`https://mangaaura.es${canonical}`}
        imageUrl={displayItem.coverUrl || undefined}
        authorName={displayItem.authorName || 'MangaAura'}
        datePublished={dbArticle.publishedAt?.toISOString() || dbArticle.createdAt.toISOString()}
        dateModified={dbArticle.updatedAt?.toISOString()}
      />
      <NewsArticleClient article={displayItem} />
    </>
  );
}
