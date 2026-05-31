import { Metadata } from 'next';


import SearchClient from './SearchClient';
import { SearchResultsPageStructuredData, BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.explore.title');
  const description = t('page.explore.description');
  const fullTitle = `${title} | MangaAura`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    alternates: { canonical: '/explore' },
  };
}

export default function SearchPage(props: any) {
  return (
    <>
      <SearchResultsPageStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Explorar', item: '/explore' },
        ]}
      />
      <SearchClient {...props} />
    </>
  );
}
