import { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.guias.title');
  const description = t('page.guias.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: t('page.guiasOg.title'),
      description: t('page.guiasOg.description'),
      type: 'website',
      images: ['/og-image.png'],
    },
    alternates: { canonical: '/guias' },
  };
}

const guides = [
  {
    href: '/guias/donde-leer-manga-legal-seguro',
    title: '¿Dónde leer manga online de forma legal y segura?',
    description: 'Descubre las mejores plataformas legales para leer manga en español. Alternativas seguras a sitios piratas con contenido de calidad.',
  },
  {
    href: '/guias/mejores-apps-leer-manga',
    title: 'Mejores aplicaciones para leer manga digitalmente',
    description: 'Comparativa de las mejores apps para leer manga en Android, iOS y PC. Lectores CBR, CBZ y plataformas oficiales.',
  },
  {
    href: '/guias/comprar-manga-digital-espana',
    title: 'Plataformas para comprar manga digital en España',
    description: '¿Dónde comprar manga digital en España? Precios, catálogo y ventajas de cada plataforma para coleccionistas y lectores.',
  },
  {
    href: '/guias/aplicaciones-recomendaciones-personalizadas',
    title: 'Apps para seguir mangas con recomendaciones personalizadas',
    description: 'Aplicaciones móviles que recomiendan mangas basados en tus gustos. Descubre tu próxima serie favorita.',
  },
  {
    href: '/guias/guia-principiantes-manga',
    title: 'Guía para principiantes en la lectura de cómics japoneses',
    description: 'Todo lo que necesitas saber para empezar a leer manga: géneros, formatos, dónde empezar y cómo leer correctamente.',
  },
  {
    href: '/guias/manga-mas-vendido-historia',
    title: '¿Cuál es el manga más vendido de la historia?',
    description: 'El ranking de los mangas más vendidos de todos los tiempos. One Piece, Golgo 13, Dragon Ball y más.',
  },
];

export default function GuidesPage() {
  return (
    <Container className="py-12">
      <h1 className="text-4xl font-bold mb-2">Guías de Manga</h1>
      <p className="text-lg text-fg-secondary mb-10">
        Aprende todo sobre el mundo del manga: dónde leer, qué apps usar, cómo empezar y más.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {guides.map((guide) => (
          <Link key={guide.href} href={guide.href} className="group">
            <article className="border border-border rounded-xl p-6 hover:border-primary transition-colors h-full">
              <h2 className="text-lg font-bold group-hover:text-primary transition-colors mb-2">
                {guide.title}
              </h2>
              <p className="text-sm text-fg-secondary">{guide.description}</p>
            </article>
          </Link>
        ))}
      </div>
    </Container>
  );
}
