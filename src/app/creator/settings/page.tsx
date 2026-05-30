import { Metadata } from 'next';

import CreatorSettingsClient from './CreatorSettingsClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.creatorSettings.title');
  const description = t('page.creatorSettings.description');
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

export default function CreatorSettingsPage(props: any) {
  return <CreatorSettingsClient {...props} />;
}
