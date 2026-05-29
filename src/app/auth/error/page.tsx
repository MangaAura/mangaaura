import { Metadata } from 'next';
import AuthErrorClient from './AuthErrorClient';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.authError.title');
  const description = t('page.authError.description');
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

export default function AuthError(props: any) {
  return <AuthErrorClient {...props} />;
}
