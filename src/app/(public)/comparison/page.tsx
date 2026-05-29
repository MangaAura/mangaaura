import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

import { BreadcrumbStructuredData, WebsiteStructuredData } from '@/components/SEO/StructuredData';
import Script from 'next/script';

import ComparisonClient from './ComparisonClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.comparison.title');
  const description = t('page.comparison.description');
  const ogDescription = t('page.comparison.ogDescription');
  const twitterDescription = t('page.comparison.twitterDescription');
  const fullTitle = `${title} | MangaAura`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description: ogDescription,
      url: `${SITE_URL}/${locale}/comparison`,
      siteName: 'MangaAura',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: twitterDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/comparison`,
    },
  };
}

const comparisonStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'MangaAura',
      description:
        'Plataforma abierta de lectura y creación de manga con IA, gamificación y crowdfunding.',
      brand: { '@type': 'Brand', name: 'MangaAura' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Lectura gratuita',
        'Lectura offline',
        'PWA y app móvil',
        'Recomendaciones con IA',
        'Gamificación completa',
        'Comunidad y clanes',
        'Publicación abierta',
        'Herramientas de IA para creadores',
        'Crowdfunding de capítulos',
        'Propinas con Aura',
      ],
      audience: {
        '@type': 'Audience',
        audienceType: 'Readers and Creators',
      },
    },
    {
      '@type': 'Product',
      name: 'Manga Plus by Shueisha',
      description:
        'Plataforma oficial de Shueisha con títulos simultáneos de Japón.',
      brand: { '@type': 'Brand', name: 'Shueisha' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'Webtoon',
      description:
        'Plataforma líder de webcomics con modelo CANVAS para creadores independientes.',
      brand: { '@type': 'Brand', name: 'NAVER' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'Tapas',
      description:
        'Plataforma de webcomics y novelas con sistema de monetización para creadores.',
      brand: { '@type': 'Brand', name: 'Kakao' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'Shonen Jump',
      description:
        'Plataforma de suscripción de Viz Media con títulos populares de Shonen Jump.',
      brand: { '@type': 'Brand', name: 'Viz Media' },
      offers: {
        '@type': 'Offer',
        price: '2.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'MangaDex',
      description:
        'Plataforma comunitaria de manga con traducciones de fans y amplio catálogo.',
      brand: { '@type': 'Brand', name: 'MangaDex' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'Product',
      name: 'INKR Comics',
      description:
        'Plataforma premium de cómics con traducción automática impulsada por IA.',
      brand: { '@type': 'Brand', name: 'INKR' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  ],
};

export default function ComparisonPage() {
  return (
    <>
      <Script
        id="comparison-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonStructuredData) }}
      />
      <WebsiteStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Comparativa', item: '/comparison' },
        ]}
      />
      <ComparisonClient />
    </>
  );
}
