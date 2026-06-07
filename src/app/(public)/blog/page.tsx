import { Metadata } from 'next';
import { Suspense } from 'react';

import { BlogClient } from './BlogClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.blog.title');
  const description = t('page.blog.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: t('page.blogOg.title'),
      description: t('page.blogOg.description'),
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/blog'),
  };
}

export default async function BlogPage() {
  const locale = await detectLocale();
  const t = getT(locale);

  const articles = await prisma.newsArticle.findMany({
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

  const breadcrumbHome = t('nav.home');
  const breadcrumbBlog = t('nav.blog');

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: breadcrumbHome, item: '/' },
          { name: breadcrumbBlog, item: '/blog' },
        ]}
      />
      <Suspense fallback={null}>
        <BlogClient initialArticles={serialized} />
      </Suspense>
    </>
  );
}
