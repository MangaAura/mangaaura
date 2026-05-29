import { Metadata } from 'next';
import BrowseClient from './BrowseClient';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.searchIa.title');
  const description = t('page.searchIa.description');
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
  };
}

export default function BrowsePage(props: any) {
  return <BrowseClient {...props} />;
}
