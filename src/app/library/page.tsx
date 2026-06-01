import { Metadata } from 'next';

import LibraryClient from './LibraryClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

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
    ...withHreflang('/library'),
  };
}

export default function LibraryPage(props: any) {
  return <LibraryClient {...props} />;
}
