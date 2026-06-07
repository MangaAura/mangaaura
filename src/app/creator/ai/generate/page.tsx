import { Metadata } from 'next';

import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

import { GenerateImageClient } from './GenerateImageClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  return {
    title: t('creator.imageGeneration.metaTitle'),
    description: t('creator.imageGeneration.metaDescription'),
  };
}

export default function GenerateImagePage() {
  return <GenerateImageClient />;
}
