import { Metadata } from 'next';

import HelpClient from './HelpClient';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

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
    ...withHreflang('/help'),
  };
}

export default function HelpPage(props: any) {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Ayuda', item: '/help' },
        ]}
      />
      <HelpClient {...props} />
    </>
  );
}
