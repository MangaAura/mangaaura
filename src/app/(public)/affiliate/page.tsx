import { Metadata } from 'next';

import AffiliatePublicClient from './AffiliatePublicClient';
import {
  BreadcrumbStructuredData,
  WebPageStructuredData,
  FAQPageStructuredData,
} from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.affiliate.title');
  const description = t('page.affiliate.description');

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
    ...withHreflang('/affiliate'),
  };
}

const faqItems = [
  {
    question: '¿Qué es el programa de afiliados de MangaAura?',
    answer: 'Es un programa que permite a creadores de contenido, influencers y fans del manga ganar comisiones por cada usuario que refieran a MangaAura. Recibirás un porcentaje de las compras de Aura y suscripciones que realicen tus referidos.',
  },
  {
    question: '¿Cuánto puedo ganar como afiliado?',
    answer: 'Las comisiones van del 10% al 25% dependiendo de tu nivel (Bronze, Silver, Gold o Platinum). Además, las comisiones son recurrentes: los primeros 3 meses para Bronze, hasta 12 meses para Gold, y de por vida para Platinum.',
  },
  {
    question: '¿Cómo me registro como afiliado?',
    answer: 'Solo necesitas una cuenta en MangaAura. Una vez registrado, puedes aplicar al programa desde tu dashboard de afiliado. Revisamos cada solicitud y te activamos automáticamente en el nivel Bronze.',
  },
  {
    question: '¿Cómo funciona el sistema de niveles?',
    answer: 'Empiezas en Bronze (10%). A medida que refieras más usuarios y generes más ingresos, subes a Silver (15%, 5+ referidos), Gold (20%, 20+ referidos) y Platinum (25%, 50+ referidos). Cada nivel tiene mejores comisiones y más meses de recurrencia.',
  },
  {
    question: '¿Cómo recibo mis comisiones?',
    answer: 'Las comisiones se pagan en Aura, la moneda virtual de MangaAura. Puedes usar tu Aura para crowdfundear capítulos, dar propinas a creadores, o retirarlo a tu cuenta bancaria (sujeto a KYC y condiciones de retiro).',
  },
  {
    question: '¿Hay algún costo para unirse?',
    answer: 'No, el programa de afiliados es completamente gratuito. No hay costos de registro ni cuotas mensuales.',
  },
];

export default function AffiliatePage() {
  return (
    <>
      <WebPageStructuredData
        name="Programa de Afiliados | MangaAura"
        description="Gana comisiones refiriendo usuarios a MangaAura. Programa de afiliados con comisiones del 10% al 25%, pagos recurrentes y múltiples niveles."
        url="/affiliate"
        datePublished="2025-06-01"
        dateModified="2025-06-05"
        breadcrumbs={[
          { name: 'Inicio', item: '/' },
          { name: 'Programa de Afiliados', item: '/affiliate' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Programa de Afiliados', item: '/affiliate' },
        ]}
      />
      <AffiliatePublicClient />
    </>
  );
}
