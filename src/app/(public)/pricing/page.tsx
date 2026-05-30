import { Metadata } from 'next';
import Script from 'next/script';

import PricingClient from './PricingClient';
import { BreadcrumbStructuredData, WebsiteStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

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
    alternates: {
      canonical: `${SITE_URL}/${locale}/pricing`,
    },
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
      offers: [
        {
          '@type': 'Offer',
          name: '100 Aura',
          price: '1.00',
          priceCurrency: 'USD',
          description: 'Paquete básico para propinas',
        },
        {
          '@type': 'Offer',
          name: '500 Aura',
          price: '4.50',
          priceCurrency: 'USD',
          description: 'Paquete popular para lectores activos (10% descuento)',
        },
        {
          '@type': 'Offer',
          name: '1000 Aura',
          price: '8.50',
          priceCurrency: 'USD',
          description: 'Mejor valor para lectores frecuentes (15% descuento)',
        },
        {
          '@type': 'Offer',
          name: '5000 Aura',
          price: '40.00',
          priceCurrency: 'USD',
          description: 'Paquete premium para patrocinadores (20% descuento)',
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'MangaAura Premium',
      description:
        'Suscripción premium con capítulos exclusivos, sin anuncios, modo offline e insignias premium.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Premium Mensual',
          price: '4.99',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
        },
        {
          '@type': 'Offer',
          name: 'Premium Anual',
          price: '49.99',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
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
