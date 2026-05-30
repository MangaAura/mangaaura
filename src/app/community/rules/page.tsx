import { Metadata } from 'next';

import CommunityRulesClient from './CommunityRulesClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.rules.title');
  const description = t('page.rules.description');

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
    alternates: { canonical: '/community/rules' },
  };
}

export default function CommunityRulesPage(props: any) {
  return <CommunityRulesClient {...props} />;
}
