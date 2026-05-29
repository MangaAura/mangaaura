import { Metadata } from 'next';
import LibraryClient from './LibraryClient';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.library.title');
  const description = t('page.library.description');
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

export default function LibraryPage(props: any) {
  return <LibraryClient {...props} />;
}
