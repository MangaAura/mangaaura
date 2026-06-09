import { Metadata } from 'next';
import Script from 'next/script';

import PricingClient from './PricingClient';
import { BreadcrumbStructuredData, WebsiteStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

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
  ratingCount: '1500',
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
  reviewBody: 'Sistema de monetización virtual que permite apoyar a creadores de manga.',
};

const RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'ES',
  merchantReturnDays: 0,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.pricing.title');
  const description = t('page.pricing.description');
  const ogDescription = t('page.pricing.ogDescription');
  const twitterDescription = t('page.pricing.twitterDescription');
  const fullTitle = `${title} | MangaAura`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description: ogDescription,
      url: `${SITE_URL}/${locale}/pricing`,
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
    ...withHreflang('/pricing'),
  };
}

const pricingStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'Aura — Moneda Virtual de MangaAura',
      description:
        'Aura es la moneda virtual de MangaAura. Úsala para dar propinas a creadores, desbloquear contenido exclusivo y más.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'MangaAura' },
      offers: [
        {
          '@type': 'Offer',
          name: '100 Aura',
          price: '1.00',
          priceCurrency: 'USD',
          description: 'Paquete básico para propinas',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
        {
          '@type': 'Offer',
          name: '500 Aura',
          price: '4.50',
          priceCurrency: 'USD',
          description: 'Paquete popular para lectores activos (10% descuento)',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
        {
          '@type': 'Offer',
          name: '1000 Aura',
          price: '8.50',
          priceCurrency: 'USD',
          description: 'Mejor valor para lectores frecuentes (15% descuento)',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
        {
          '@type': 'Offer',
          name: '5000 Aura',
          price: '40.00',
          priceCurrency: 'USD',
          description: 'Paquete premium para patrocinadores (20% descuento)',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'MangaAura Premium',
      description:
        'Suscripción premium con capítulos exclusivos, sin anuncios, modo offline e insignias premium.',
      image: 'https://mangaaura.es/og-image.webp',
      aggregateRating: AGGREGATE_RATING,
      review: REVIEW,
      brand: { '@type': 'Brand', name: 'MangaAura' },
      offers: [
        {
          '@type': 'Offer',
          name: 'Premium Mensual',
          price: '4.99',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
        {
          '@type': 'Offer',
          name: 'Premium Anual',
          price: '49.99',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: RETURN_POLICY,
          shippingDetails: SHIPPING_DETAILS,
        },
      ],
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <Script
        id="pricing-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingStructuredData) }}
      />
      <WebsiteStructuredData />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Precios', item: '/pricing' },
        ]}
      />
      <PricingClient />
    </>
  );
}
