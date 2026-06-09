import { Metadata } from 'next';
import Script from 'next/script';

import ComparisonClient from './ComparisonClient';
import { BreadcrumbStructuredData, FAQPageStructuredData, WebsiteStructuredData, WebPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

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
    ...withHreflang('/comparison'),
  };
}

const SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'ES',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 0,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 0,
      unitCode: 'DAY',
    },
  },
};

const AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: '4.5',
  bestRating: '5',
  ratingCount: '500',
};

const REVIEW = {
  '@type': 'Review',
  reviewRating: {
    '@type': 'Rating',
    ratingValue: '4.5',
    bestRating: '5',
  },
  author: {
    '@type': 'Organization',
    name: 'MangaAura',
  },
  reviewBody: 'Plataforma recomendada para leer y crear manga con herramientas de IA integradas.',
};

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'ES',
  merchantReturnDays: 0,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
};

const comparisonStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'MangaAura',
      description:
        'Plataforma abierta de lectura y creación de manga con IA, gamificación y crowdfunding.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'MangaAura' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
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
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'Shueisha' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
    {
      '@type': 'Product',
      name: 'Webtoon',
      description:
        'Plataforma líder de webcomics con modelo CANVAS para creadores independientes.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'NAVER' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
    {
      '@type': 'Product',
      name: 'Tapas',
      description:
        'Plataforma de webcomics y novelas con sistema de monetización para creadores.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'Kakao' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
    {
      '@type': 'Product',
      name: 'Shonen Jump',
      description:
        'Plataforma de suscripción de Viz Media con títulos populares de Shonen Jump.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'Viz Media' },
      offers: {
        '@type': 'Offer',
        price: '2.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
    {
      '@type': 'Product',
      name: 'MangaDex',
      description:
        'Plataforma comunitaria de manga con traducciones de fans y amplio catálogo.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'MangaDex' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
    {
      '@type': 'Product',
      name: 'INKR Comics',
      description:
        'Plataforma premium de cómics con traducción automática impulsada por IA.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'INKR' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    },
  ],
};

export default async function ComparisonPage() {
  const locale = await detectLocale();
  const t = getT(locale);

  const faqItems = [
    { question: t('comparison.faq1Q'), answer: t('comparison.faq1A') },
    { question: t('comparison.faq2Q'), answer: t('comparison.faq2A') },
    { question: t('comparison.faq3Q'), answer: t('comparison.faq3A') },
    { question: t('comparison.faq4Q'), answer: t('comparison.faq4A') },
    { question: t('comparison.faq5Q'), answer: t('comparison.faq5A') },
    { question: t('comparison.faq6Q'), answer: t('comparison.faq6A') },
    { question: t('comparison.faq7Q'), answer: t('comparison.faq7A') },
  ];

  return (
    <>
      <Script
        id="comparison-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonStructuredData) }}
      />
      <WebPageStructuredData
        name={t('page.comparison.title')}
        description={t('page.comparison.description')}
        url="/comparison"
        lastReviewed={new Date().toISOString().split('T')[0]}
        datePublished="2026-01-01"
        dateModified={new Date().toISOString().split('T')[0]}
        breadcrumbs={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.comparison'), item: '/comparison' },
        ]}
      />
      <WebsiteStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.comparison'), item: '/comparison' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />
      <ComparisonClient />
    </>
  );
}
