import { Metadata } from 'next';

import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

import { GenerateImageClient } from './GenerateImageClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('creator.imageGeneration.metaTitle');
  const description = t('creator.imageGeneration.metaDescription');

  return {
    title,
    description,
    robots: { index: false, follow: false },
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
    alternates: { canonical: '/creator/ai/generate' },
  };
}

export default function GenerateImagePage() {
  return <GenerateImageClient />;
}
