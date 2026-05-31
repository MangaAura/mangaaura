import { Metadata } from 'next';
import { Suspense } from 'react';

import { NewsClient } from './NewsClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
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

export default function NewsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Noticias', item: '/news' },
        ]}
      />
      <Suspense fallback={null}>
        <NewsClient />
      </Suspense>
    </>
  );
}
