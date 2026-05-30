import { Metadata } from 'next';

import CollectionsPageContent from './CollectionsPageContent';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.collections.title');
  const description = t('page.collections.description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
  };
}

export default function CollectionsPage() {
  return <CollectionsPageContent />;
}
