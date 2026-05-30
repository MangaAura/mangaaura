import { Metadata } from 'next';

import AboutClient from './AboutClient';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.sobreNosotros.title');
  const description = t('page.sobreNosotros.description');

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
    alternates: { canonical: '/sobre-nosotros' },
  };
}

export default function AboutPage(props: any) {
  return <AboutClient {...props} />;
}
