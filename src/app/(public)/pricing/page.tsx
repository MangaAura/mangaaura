import { Metadata } from 'next';
import { headers } from 'next/headers';

import { BreadcrumbStructuredData, WebsiteStructuredData } from '@/components/SEO/StructuredData';
import Script from 'next/script';

import PricingClient from './PricingClient';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'es';

  return {
    title: 'Precios y Planes | MangaAura',
    description:
      'Compra Aura para apoyar a tus creadores favoritos o suscríbete a Premium para acceso a capítulos exclusivos, sin anuncios y modo offline. Precios desde $1.00.',
    openGraph: {
      title: 'Precios y Planes | MangaAura',
      description:
        'Compra Aura para apoyar a tus creadores favoritos o suscríbete a Premium para acceso a capítulos exclusivos, sin anuncios y modo offline.',
      url: `${SITE_URL}/${locale}/pricing`,
      siteName: 'MangaAura',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Precios y Planes | MangaAura',
      description:
        'Compra Aura para apoyar a tus creadores favoritos o suscríbete a Premium.',
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
