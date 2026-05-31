import { Metadata } from 'next';

import AboutClient from './AboutClient';
import { BreadcrumbStructuredData, WebPageStructuredData, OrganizationStructuredData, FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

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
    ...withHreflang('/sobre-nosotros'),
  };
}

export default function AboutPage(props: any) {
  const faqItems = [
    {
      question: '¿Qué es MangaAura?',
      answer: 'MangaAura es una plataforma de manga que conecta lectores con creadores. Ofrece herramientas de IA para crear manga, crowdfunding de capítulos con Aura, y una comunidad global de amantes del manga.'
    },
    {
      question: '¿MangaAura es gratis?',
      answer: 'Sí, MangaAura es completamente gratis para lectores. Puedes leer miles de mangas sin pagar nada. Los creadores tienen herramientas gratuitas y opciones premium opcionales.'
    },
    {
      question: '¿Cómo puedo crear mi propio manga?',
      answer: 'Cualquier persona puede crear y publicar su propio manga en MangaAura. Nuestras herramientas de IA te ayudan a generar personajes, escenarios y guiones sin necesidad de experiencia en dibujo.'
    },
    {
      question: '¿Qué es Aura?',
      answer: 'Aura es la moneda virtual de MangaAura. Se usa para crowdfundear capítulos, dar propinas a creadores, y acceder a contenido exclusivo. Los lectores pueden comprar Aura o ganarla mediante eventos, y los creadores la reciben como recompensa.'
    },
  ];

  return (
    <>
      <WebPageStructuredData
        name="Sobre nosotros | MangaAura"
        description="Conoce al equipo detrás de MangaAura, la plataforma de manga con IA que conecta lectores y creadores."
        url="/sobre-nosotros"
        datePublished="2024-01-01"
        dateModified="2025-05-28"
        breadcrumbs={[
          { name: 'Inicio', item: '/' },
          { name: 'Sobre nosotros', item: '/sobre-nosotros' },
        ]}
      />
      <OrganizationStructuredData />
      <FAQPageStructuredData
        items={faqItems}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Sobre nosotros', item: '/sobre-nosotros' },
        ]}
      />
      <AboutClient {...props} />
    </>
  );
}
