import { Metadata } from 'next';
import SignupAnalyticsClient from './SignupAnalyticsClient';

import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.analyticsSignup.title');
  const description = t('page.analyticsSignup.description');
  const fullTitle = `${title} | MangaAura`;

  return {
    robots: { index: false, follow: false },
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

export default function SignupAnalyticsPage(props: any) {
  return <SignupAnalyticsClient {...props} />;
}
