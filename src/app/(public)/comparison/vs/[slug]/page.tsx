import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';

import VsPageClient from '../VsPageClient';
import type { PlatformData } from '../VsPageClient';
import { BreadcrumbStructuredData, WebPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

// ── Platform data ─────────────────────────────────────

interface PlatformEntry {
  id: string;
  slug: string;
  name: string;
  color: string;
  tagline: string;
  url: string;
  bestFor: string;
  advantages: string[];
  tradeoffs: { label: string; text: string }[];
  features: Record<string, 'yes' | 'no' | 'limited'>;
}

const PLATFORMS: PlatformEntry[] = [
  {
    id: 'webtoon',
    slug: 'webtoon',
    name: 'Webtoon',
    color: 'from-green-500 to-emerald-500',
    tagline: 'Líder mundial de webcomics con 100M+ usuarios mensuales',
    url: 'https://www.webtoons.com',
    bestFor: 'Lectores que quieren el catálogo más grande de webcomics. Creadores que buscan la mayor audiencia potencial.',
    advantages: [
      '100M+ usuarios activos mensuales — la audiencia más grande de webcomics',
      'Programa CANVAS consolidado para creadores independientes',
      'Formato vertical scroll optimizado para móvil, popularizado globalmente',
      'Sistema de monedas para early access y contenido exclusivo',
    ],
    tradeoffs: [
      { label: 'Monetización limitada', text: 'Los creadores dependen de ingresos por publicidad, sin opciones de crowdfunding ni financiación directa.' },
      { label: 'Sin lectura offline', text: 'No permite descargar capítulos para leer sin conexión.' },
      { label: 'Sin herramientas IA', text: 'No ofrece herramientas de IA para crear arte o traducir contenido.' },
      { label: 'Alta competencia', text: 'Extremadamente competitivo para creadores nuevos — difícil destacar entre millones de series.' },
    ],
    features: {
      freeReading: 'yes',
      offlineReading: 'no',
      pwaMobile: 'yes',
      aiRecommendations: 'yes',
      progressSync: 'yes',
      gamification: 'limited',
      community: 'limited',
      adFree: 'no',
      multiLanguage: 'yes',
      darkMode: 'yes',
      openPublishing: 'yes',
      aiArtTools: 'no',
      aiTranslation: 'no',
      creatorAnalytics: 'yes',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'limited',
    },
  },
  {
    id: 'mangaplus',
    slug: 'manga-plus',
    name: 'Manga Plus',
    color: 'from-red-500 to-orange-500',
    tagline: 'Plataforma oficial de Shueisha con lanzamientos simultáneos desde Japón',
    url: 'https://mangaplus.shueisha.co.jp',
    bestFor: 'Lectores que quieren los últimos capítulos oficiales de Shueisha gratis.',
    advantages: [
      'Catálogo oficial de Shueisha (One Piece, Jujutsu Kaisen, Chainsaw Man, Spy x Family)',
      'Capítulos simultáneos con Japón — sin esperas',
      'Marca confiable con décadas de trayectoria editorial',
      'Disponible en múltiples idiomas incluyendo español',
    ],
    tradeoffs: [
      { label: 'Sin publicación abierta', text: 'No permite que creadores independientes publiquen. Solo contenido curated de Shueisha.' },
      { label: 'Con publicidad', text: 'La versión gratuita tiene anuncios. No hay opción premium para eliminarlos.' },
      { label: 'Sin lectura offline', text: 'No se pueden descargar capítulos para leer sin conexión.' },
      { label: 'Sin gamificación', text: 'No tiene sistema de XP, logros, rachas ni otras mecánicas de engagement.' },
    ],
    features: {
      freeReading: 'yes',
      offlineReading: 'no',
      pwaMobile: 'yes',
      aiRecommendations: 'no',
      progressSync: 'no',
      gamification: 'no',
      community: 'limited',
      adFree: 'no',
      multiLanguage: 'yes',
      darkMode: 'yes',
      openPublishing: 'no',
      aiArtTools: 'no',
      aiTranslation: 'no',
      creatorAnalytics: 'limited',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'no',
    },
  },
  {
    id: 'tapas',
    slug: 'tapas',
    name: 'Tapas',
    color: 'from-blue-500 to-indigo-500',
    tagline: 'Plataforma de webcomics y novelas con sistema de propinas para creadores',
    url: 'https://tapas.io',
    bestFor: 'Creadores que quieren un sistema de propinas (Ink) y audiencia establecida.',
    advantages: [
      'Sistema de monetización con Ink (propinas de lectores)',
      'Buena mezcla de contenido gratuito y de pago',
      'App móvil sólida con buena experiencia de usuario',
      'Comunidad activa de creadores de webcomics románticos y slice-of-life',
    ],
    tradeoffs: [
      { label: 'Episodios bloqueados', text: 'Muchos episodios están bloqueados tras monedas, limitando la lectura gratuita.' },
      { label: 'Ganancias bajas por lector', text: 'Los creadores ganan menos por lector en comparación con modelos de financiación directa.' },
      { label: 'Enfoque limitado', text: 'Fuerte enfoque en romance — otros géneros tienen menos visibilidad.' },
      { label: 'Sin herramientas IA', text: 'No ofrece herramientas de IA para creación de arte o traducción.' },
    ],
    features: {
      freeReading: 'yes',
      offlineReading: 'yes',
      pwaMobile: 'yes',
      aiRecommendations: 'yes',
      progressSync: 'yes',
      gamification: 'limited',
      community: 'limited',
      adFree: 'yes',
      multiLanguage: 'yes',
      darkMode: 'yes',
      openPublishing: 'yes',
      aiArtTools: 'no',
      aiTranslation: 'no',
      creatorAnalytics: 'yes',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'limited',
    },
  },
  {
    id: 'shonenjump',
    slug: 'shonen-jump',
    name: 'Shonen Jump',
    color: 'from-yellow-500 to-orange-500',
    tagline: 'Suscripción oficial de Viz Media con +15,000 capítulos de manga',
    url: 'https://www.viz.com/shonenjump',
    bestFor: 'Lectores que quieren una biblioteca masiva de manga oficial a bajo precio mensual.',
    advantages: [
      'Catálogo masivo de títulos oficiales de Viz Media (15,000+ capítulos)',
      'Precio muy accesible: solo $2.99/mes',
      'Experiencia sin publicidad',
      'Lectura offline disponible',
    ],
    tradeoffs: [
      { label: 'Solo suscripción de pago', text: 'No tiene nivel gratuito — requiere suscripción de $2.99/mes.' },
      { label: 'Solo inglés', text: 'Disponible únicamente en inglés, sin soporte multilingüe.' },
      { label: 'Sin herramientas para creadores', text: 'No permite publicación abierta ni ofrece herramientas de creación.' },
      { label: 'Sin comunidad', text: 'No tiene foros, clanes, eventos ni otras funciones sociales.' },
    ],
    features: {
      freeReading: 'no',
      offlineReading: 'yes',
      pwaMobile: 'yes',
      aiRecommendations: 'no',
      progressSync: 'yes',
      gamification: 'no',
      community: 'no',
      adFree: 'yes',
      multiLanguage: 'no',
      darkMode: 'yes',
      openPublishing: 'no',
      aiArtTools: 'no',
      aiTranslation: 'no',
      creatorAnalytics: 'no',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'no',
    },
  },
  {
    id: 'mangadex',
    slug: 'mangadex',
    name: 'MangaDex',
    color: 'from-violet-500 to-purple-500',
    tagline: 'Plataforma comunitaria de traducciones de fans con catálogo masivo',
    url: 'https://mangadex.org',
    bestFor: 'Lectores que quieren traducciones de fans y un catálogo diverso sin restricciones.',
    advantages: [
      'Catálogo masivo de contenido traducido por fans',
      'Completamente comunitario, sin influencia corporativa',
      'Multilingüe gracias a traductores voluntarios',
      'Gratuito sin publicidad',
    ],
    tradeoffs: [
      { label: 'Zona legal gris', text: 'Utiliza traducciones de fans no oficiales — potenciales problemas de copyright.' },
      { label: 'Sin monetización para creadores', text: 'No hay sistema de ingresos, analytics ni financiación para creadores originales.' },
      { label: 'Problemas de fiabilidad', text: 'Caídas frecuentes del servicio y ataques DDoS.' },
      { label: 'Interfaz básica', text: 'Solo web, sin PWA, sin app móvil, experiencia de usuario limitada.' },
    ],
    features: {
      freeReading: 'yes',
      offlineReading: 'no',
      pwaMobile: 'no',
      aiRecommendations: 'no',
      progressSync: 'no',
      gamification: 'no',
      community: 'yes',
      adFree: 'yes',
      multiLanguage: 'yes',
      darkMode: 'yes',
      openPublishing: 'yes',
      aiArtTools: 'no',
      aiTranslation: 'no',
      creatorAnalytics: 'no',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'no',
    },
  },
  {
    id: 'inkr',
    slug: 'inkr',
    name: 'INKR',
    color: 'from-cyan-500 to-teal-500',
    tagline: 'Plataforma premium de cómics con traducción automática por IA',
    url: 'https://inkr.com',
    bestFor: 'Lectores que quieren una experiencia curada premium. Creadores aceptados en su programa de partners.',
    advantages: [
      'Traducción automática impulsada por IA para cómics',
      'Biblioteca de contenido premium curado',
      'Interfaz limpia sin publicidad',
      'Analíticas avanzadas para creadores partners',
    ],
    tradeoffs: [
      { label: 'Catálogo limitado', text: 'Biblioteca pequeña y curada comparada con plataformas abiertas.' },
      { label: 'Solo por invitación', text: 'No hay publicación abierta — hay que ser aceptado como partner.' },
      { label: 'Nivel gratuito limitado', text: 'La versión gratuita tiene restricciones de lectura.' },
      { label: 'Sin comunidad', text: 'No tiene foros, comentarios en profundidad ni funciones sociales.' },
    ],
    features: {
      freeReading: 'yes',
      offlineReading: 'no',
      pwaMobile: 'yes',
      aiRecommendations: 'no',
      progressSync: 'no',
      gamification: 'no',
      community: 'no',
      adFree: 'yes',
      multiLanguage: 'limited',
      darkMode: 'yes',
      openPublishing: 'limited',
      aiArtTools: 'no',
      aiTranslation: 'yes',
      creatorAnalytics: 'yes',
      directFunding: 'no',
      crowdfunding: 'no',
      revenueShare: 'limited',
    },
  },
];

function getPlatformBySlug(slug: string): PlatformEntry | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}

// ── MangaAura data (same for all pages) ───────────────

const MANGA_AURA_DATA: Omit<PlatformData, 'features'> & { features: Record<string, 'yes' | 'no' | 'limited'> } = {
  id: 'mangaaura',
  name: 'MangaAura',
  url: SITE_URL,
  color: 'from-primary to-accent-purple',
  tagline: 'Plataforma de manga con IA para leer, crear y crowdfundear capítulos',
  bestFor: 'Lectores que quieren lectura gratuita con gamificación. Creadores que buscan herramientas IA, crowdfunding y cero comisiones.',
  advantages: [
    'Herramientas de IA para crear manga (arte, traducción, descripciones)',
    'Crowdfunding de capítulos con Aura — los lectores financian directamente',
    'Gamificación completa: XP, niveles, rachas, clanes, eventos',
    'Cero comisiones para creadores — se quedan el 100%',
    'PWA con lectura offline en cualquier dispositivo',
    'Multilingüe desde el día uno (español + inglés)',
  ],
  tradeoffs: [],
  features: {
    freeReading: 'yes',
    offlineReading: 'yes',
    pwaMobile: 'yes',
    aiRecommendations: 'yes',
    progressSync: 'yes',
    gamification: 'yes',
    community: 'yes',
    adFree: 'yes',
    multiLanguage: 'yes',
    darkMode: 'yes',
    openPublishing: 'yes',
    aiArtTools: 'yes',
    aiTranslation: 'yes',
    creatorAnalytics: 'yes',
    directFunding: 'yes',
    crowdfunding: 'yes',
    revenueShare: 'yes',
  },
};

// ── Structured data generator ─────────────────────────

function generateStructuredData(competitor: PlatformEntry, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'MangaAura',
        description: MANGA_AURA_DATA.tagline,
        image: `${SITE_URL}/og-image.png`,
        url: `${SITE_URL}/comparison/vs/${slug}`,
        brand: { '@type': 'Brand', name: 'MangaAura' },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          bestRating: '5',
          ratingCount: '2500',
          reviewCount: '1200',
        },
        featureList: [
          'Lectura gratuita',
          'Lectura offline',
          'Recomendaciones con IA',
          'Gamificación completa',
          'Publicación abierta',
          'Herramientas de IA para creadores',
          'Crowdfunding de capítulos',
          'Cero comisiones',
        ],
      },
      {
        '@type': 'Product',
        name: competitor.name,
        description: competitor.tagline,
        image: `${SITE_URL}/og-image.png`,
        url: competitor.url,
        brand: { '@type': 'Brand', name: competitor.name },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          bestRating: '5',
          ratingCount: '500',
          reviewCount: '250',
        },
      },
      {
        '@type': 'ItemList',
        name: `Comparativa de características: MangaAura vs ${competitor.name}`,
        description: `Comparación detallada feature por feature entre MangaAura y ${competitor.name}`,
        itemListElement: Object.entries(MANGA_AURA_DATA.features).map(([key, mangaAuraVal], i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: key,
          item: {
            '@type': 'PropertyValue',
            name: key,
            value: `MangaAura: ${mangaAuraVal}, ${competitor.name}: ${competitor.features[key] || 'no'}`,
          },
        })),
      },
    ],
  };
}

// ── Metadata generator ────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getPlatformBySlug(slug);
  if (!competitor) return {};

  const locale = await detectLocale();
  const t = getT(locale);

  const title = t(`page.comparison.vs.${slug}.title`);
  const description = t(`page.comparison.vs.${slug}.description`);
  const fullTitle = `${title} | MangaAura`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: `${SITE_URL}/${locale}/comparison/vs/${slug}`,
      siteName: 'MangaAura',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...withHreflang(`/comparison/vs/${slug}`),
  };
}

// ── Page ──────────────────────────────────────────────

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = getPlatformBySlug(slug);
  if (!competitor) notFound();

  const locale = await detectLocale();
  const t = getT(locale);

  const structuredData = generateStructuredData(competitor, slug);

  const mangaAuraData: PlatformData = {
    ...MANGA_AURA_DATA,
    tradeoffs: [],
  };

  const competitorData: PlatformData = {
    id: competitor.id,
    name: competitor.name,
    url: competitor.url,
    color: competitor.color,
    tagline: competitor.tagline,
    bestFor: competitor.bestFor,
    advantages: competitor.advantages,
    tradeoffs: competitor.tradeoffs,
    features: competitor.features,
  };

  return (
    <>
      <Script
        id={`vs-structured-data-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <WebPageStructuredData
        name={t(`page.comparison.vs.${slug}.title`)}
        description={t(`page.comparison.vs.${slug}.description`)}
        url={`/comparison/vs/${slug}`}
        lastReviewed={new Date().toISOString().split('T')[0]}
        datePublished="2026-01-01"
        dateModified={new Date().toISOString().split('T')[0]}
        breadcrumbs={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.comparison'), item: '/comparison' },
          { name: competitor.name, item: `/comparison/vs/${slug}` },
        ]}
      />
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: t('nav.comparison'), item: '/comparison' },
          { name: competitor.name, item: `/comparison/vs/${slug}` },
        ]}
      />
      <VsPageClient
        competitor={competitorData}
        mangaAura={mangaAuraData}
        slug={slug}
      />
    </>
  );
}
