import { Metadata } from 'next';
import { Suspense } from 'react';

import { NewsClient } from './NewsClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

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
    alternates: { canonical: '/news' },
  };
}

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <NewsClient />
    </Suspense>
  );
}
