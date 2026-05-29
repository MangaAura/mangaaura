import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import HelpClient from './HelpClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.help.title');
  const description = t('page.help.description');

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
    alternates: { canonical: '/help' },
  };
}

export default function HelpPage(props: any) {
  return <HelpClient {...props} />;
}
