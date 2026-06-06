import { Metadata } from 'next';
import { Suspense } from 'react';

import { NewsClient } from './NewsClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.news.title');
  const description = t('page.news.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/news'),
  };
}

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { isPublished: true },
    orderBy: [
      { isFeatured: 'desc' },
      { publishedAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      titleEn: true,
      excerptEn: true,
      coverUrl: true,
      category: true,
      isFeatured: true,
      publishedAt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  const serialized = articles.map((a) => ({
    ...a,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  const locale = await detectLocale();
  const t = getT(locale);
  const breadcrumbHome = t('nav.home');
  const breadcrumbNews = t('nav.news');

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: breadcrumbHome, item: '/' },
          { name: breadcrumbNews, item: '/news' },
        ]}
      />
      <Suspense fallback={null}>
        <NewsClient initialArticles={serialized} />
      </Suspense>
    </>
  );
}
