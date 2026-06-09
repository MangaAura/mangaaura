import type { Metadata } from 'next';

import { HomeContent } from '@/components/Home/HomeContent';
import { BreadcrumbStructuredData, FAQPageStructuredData, WebPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

// ISR: revalidate every 5 min so manga/user/chapter counts stay fresh
// without hitting the DB on every request (Next.js would statically render
// this page at build time if not for this export, baking in 0s)
export const revalidate = 300;


export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('nav.home');
  const description = t('home.description');
  const fullTitle = `${title} | MangaAura`;

  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/', locale),
  };
}


interface MangaItem {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string | null;
  tags: unknown;
  authorName: string | null;
  author: { username: string } | null;
  rating: number | null;
  totalViews?: number;
  _count?: { chapters: number };
}

function normalizeManga(m: MangaItem) {
  return {
    id: m.id,
    title: m.title,
    slug: m.slug,
    coverUrl: m.coverUrl,
    status: m.status ?? undefined,
    tags: parseTags(m.tags),
    authorName: m.authorName,
    authorUsername: m.author?.username ?? undefined,
    rating: m.rating ?? 0,
    chapterCount: m._count?.chapters ?? 0,
    totalViews: m.totalViews,
  };
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[];
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  return [];
}

export default async function HomePage() {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('nav.home');
  const description = t('home.description');
  const whereActive = { deletedAt: null };

  // Cache stats in Redis — runs in parallel with other queries below
  const statsPromise = withCache(
    generateCacheKey('stats:homepage', {}),
    cacheConfig.stats.homepage.ttl,
    async () => {
    const [totalMangas, totalReaders, totalChapters] = await Promise.all([
      prisma.mangaSeries.count({ where: whereActive }),
      prisma.user.count(),
      prisma.chapter.count(),
    ]);
      return { totalMangas, totalReaders, totalChapters };
    },
  );

  const homepageTtl = 360; // longer than ISR revalidate (300) so cache is always hot during revalidation

  const [latestMangas, topMangas, updatingMangas, trendingMangas, topUsers, featuredManga, newsArticles, stats] = await Promise.all([
    withCache(
      generateCacheKey('homepage:latest', {}),
      homepageTtl,
      () => prisma.mangaSeries.findMany({
        where: whereActive,
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, slug: true, coverUrl: true, status: true,
          tags: true, authorName: true, author: { select: { username: true } },
          rating: true, _count: { select: { chapters: true } },
        },
      }),
    ),
    withCache(
      generateCacheKey('homepage:top', {}),
      homepageTtl,
      () => prisma.mangaSeries.findMany({
        where: whereActive,
        take: 5,
        orderBy: { totalViews: 'desc' },
        select: {
          id: true, title: true, slug: true, coverUrl: true, status: true,
          tags: true, authorName: true, author: { select: { username: true } },
          rating: true, totalViews: true, _count: { select: { chapters: true } },
        },
      }),
    ),
    withCache(
      generateCacheKey('homepage:updating', {}),
      homepageTtl,
      () => prisma.mangaSeries.findMany({
        where: whereActive,
        take: 6,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, title: true, slug: true, coverUrl: true, status: true,
          tags: true, authorName: true, author: { select: { username: true } },
          rating: true, _count: { select: { chapters: true } },
        },
      }),
    ),
    withCache(
      generateCacheKey('homepage:trending', {}),
      homepageTtl,
      () => prisma.mangaSeries.findMany({
        where: { ...whereActive, totalViews: { gt: 0 } },
        take: 8,
        orderBy: [{ totalViews: 'desc' }, { updatedAt: 'desc' }],
        select: {
          id: true, title: true, slug: true, coverUrl: true, status: true,
          tags: true, authorName: true, author: { select: { username: true } },
          rating: true, totalViews: true, _count: { select: { chapters: true } },
        },
      }),
    ),
    withCache(
      generateCacheKey('homepage:toplectores', {}),
      homepageTtl,
      () => prisma.user.findMany({
        take: 5,
        orderBy: { xpPoints: 'desc' },
        select: { id: true, username: true, avatarUrl: true, level: true, xpPoints: true },
      }),
    ),
    withCache(
      generateCacheKey('homepage:featured', {}),
      homepageTtl,
      () => prisma.mangaSeries.findFirst({
        where: { ...whereActive, isHomepageFeatured: true },
        select: { id: true, title: true, slug: true, coverUrl: true, description: true, authorName: true },
      }),
    ),
    withCache(
      generateCacheKey('homepage:news', {}),
      homepageTtl,
      async () => {
        const articles = await prisma.newsArticle.findMany({
          where: { isPublished: true },
          orderBy: [
            { isFeatured: 'desc' },
            { publishedAt: 'desc' },
          ],
          take: 7,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            titleEn: true,
            excerptEn: true,
            contentEn: true,
            coverUrl: true,
            category: true,
            isFeatured: true,
            publishedAt: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });
        return articles.map((a) => ({
          ...a,
          publishedAt: a.publishedAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        }));
      },
    ),
    statsPromise,
  ]);

  const { totalMangas, totalReaders, totalChapters } = stats;

  const faqItems = [
    {
      question: '¿Qué es MangaAura?',
      answer: `MangaAura es una plataforma de manga con IA que cuenta con más de ${totalMangas.toLocaleString()} series de manga, ${totalChapters.toLocaleString()} capítulos publicados y una comunidad activa de más de ${totalReaders.toLocaleString()} lectores. Puedes leer mangas gratis, crear tus propias series con herramientas de IA, crowdfundear capítulos usando Aura y ganar XP mientras lees.`,
    },
    {
      question: '¿Cómo puedo crear mi propio manga?',
      answer: 'Crear tu propio manga en MangaAura es sencillo: regístrate como creador, accede al panel de creador y sube tus capítulos con portada y descripción. MangaAura ofrece herramientas potenciadas por IA para generar descripciones automáticas, traducciones a múltiples idiomas y recomendaciones inteligentes que aumentan la visibilidad de tu obra entre los lectores.',
    },
    {
      question: '¿Qué es Aura y cómo funciona?',
      answer: 'Aura es la moneda virtual de MangaAura. Los lectores la usan para crowdfundear capítulos (apoyando económicamente a los creadores), dar propinas, patrocinar contenido exclusivo y participar en eventos especiales. Los creadores reciben Aura como recompensa por su trabajo, creando un ecosistema sostenible donde todos ganan.',
    },
    {
      question: '¿Es gratis leer mangas en MangaAura?',
      answer: `Sí, leer mangas en MangaAura es completamente gratuito. Actualmente la plataforma alberga ${totalMangas.toLocaleString()} series con ${totalChapters.toLocaleString()} capítulos disponibles sin costo. Además, mientras lees acumulas XP, subes de nivel en más de 50 logros, mantienes rachas de lectura y apareces en los rankings globales. Todo 100% gratis, sin límites de lectura ni suscripciones obligatorias.`,
    },
    {
      question: '¿Cómo funciona el crowdfunding de capítulos?',
      answer: 'El crowdfunding en MangaAura permite a los lectores contribuir con Aura directamente a los capítulos que quieren ver publicados. Cada capítulo tiene una meta de financiamiento. Cuando la comunidad alcanza la meta, el capítulo se libera para todos los lectores. Este sistema permite a los creadores recibir apoyo directo de su audiencia mientras mantienen el contenido accesible para toda la comunidad.',
    },
  ];

  // Preload the hero cover image (LCP element) for faster paint
  const heroCoverUrl = featuredManga?.coverUrl;

  return (
    <>
      {heroCoverUrl && (
        <link
          rel="preload"
          as="image"
          href={heroCoverUrl}
          fetchPriority="high"
        />
      )}
      <WebPageStructuredData
        name={title}
        description={description}
        url="/"
        lastReviewed={new Date().toISOString().split('T')[0]}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
        ]}
      />
      <FAQPageStructuredData items={faqItems} />
      <HomeContent
        latestMangas={latestMangas.map(normalizeManga)}
        topMangas={topMangas.map(normalizeManga)}
        updatingMangas={updatingMangas.map(normalizeManga)}
        trendingMangas={trendingMangas.map(normalizeManga)}
        newsArticles={newsArticles}
        topUsers={topUsers}
        featuredManga={featuredManga}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />
    </>
  );
}