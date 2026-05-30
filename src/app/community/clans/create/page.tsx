import { Metadata } from 'next';

import CreateClanClient from './CreateClanClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.clansCreate.title');
  const description = t('page.clansCreate.description');

  return {
    title,
    description,
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
    alternates: { canonical: '/community/clans/create' },
  };
}

export default function CreateClanPage(props: any) {
  return <CreateClanClient {...props} />;
}
