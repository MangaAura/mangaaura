import { Metadata } from 'next';

import AnalyticsClient from './AnalyticsClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.analytics.title');
  const description = t('page.analytics.description');
  const fullTitle = `${title} | MangaAura`;

  return {
    robots: { index: false, follow: false },
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  };
}

export default function AnalyticsPage(props: any) {
  return <AnalyticsClient {...props} />;
}
