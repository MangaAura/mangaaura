import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogArticleClient } from './BlogArticleClient';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { dbArticleToDisplayItem } from '@/lib/news';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const article = await prisma.newsArticle.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true, updatedAt: true },
  });

  if (article) {
    const description = article.excerpt?.slice(0, 160) || `Lee ${article.title} en MangaAura.`;
    const ogImage = `/api/og?type=blog&title=${encodeURIComponent(article.title)}&cover=${article.coverUrl ? encodeURIComponent(article.coverUrl) : ''}`;

    return {
      title: `${article.title} | MangaAura`,
      description,
      openGraph: {
        title: `${article.title} | MangaAura`,
        description,
        type: 'article',
        images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
        publishedTime: article.publishedAt?.toISOString(),
        modifiedTime: article.updatedAt?.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${article.title} | MangaAura`,
        description,
        images: [ogImage],
      },
      ...withHreflang(`/blog/${article.slug}`),
    };
  }

  return { title: 'Artículo no encontrado | MangaAura' };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;

  const dbArticle = await prisma.newsArticle.findUnique({
    where: { slug, isPublished: true },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  if (!dbArticle) notFound();

  const displayItem = dbArticleToDisplayItem(dbArticle);
  const canonical = `/blog/${displayItem.slug}`;

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Blog', item: '/blog' },
          { name: displayItem.title, item: `/blog/${displayItem.slug}` },
        ]}
      />
      <ArticleStructuredData
        title={`${displayItem.title} | MangaAura`}
        description={displayItem.description}
        url={`https://mangaaura.es${canonical}`}
        imageUrl={displayItem.coverUrl || undefined}
        authorName={displayItem.authorName || 'MangaAura'}
        datePublished={dbArticle.publishedAt?.toISOString() || dbArticle.createdAt.toISOString()}
        dateModified={dbArticle.updatedAt?.toISOString()}
      />
      <BlogArticleClient article={displayItem} />
    </>
  );
}
