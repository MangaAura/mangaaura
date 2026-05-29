import { Metadata } from 'next';
import SearchClient from './SearchClient';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.explore.title');
  const description = t('page.explore.description');
  const fullTitle = `${title} | MangaAura`;

  return {
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
    alternates: { canonical: '/explore' },
  };
}

export default function SearchPage(props: any) {
  return <SearchClient {...props} />;
}
