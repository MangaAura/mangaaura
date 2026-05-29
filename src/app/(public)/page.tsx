import Script from 'next/script';
import { HomeContent } from '@/components/Home/HomeContent';
import { prisma } from '@/lib/prisma';


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
  const whereActive = { deletedAt: null };
  const [latestMangas, topMangas, updatingMangas, topUsers, featuredManga, totalMangas, totalReaders, totalChapters] = await Promise.all([
    prisma.mangaSeries.findMany({
      where: whereActive,
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      where: whereActive,
      take: 5,
      orderBy: { totalViews: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, totalViews: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      where: whereActive,
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { xpPoints: 'desc' },
      select: { id: true, username: true, avatarUrl: true, level: true, xpPoints: true },
    }),
    prisma.mangaSeries.findFirst({
      where: { ...whereActive, totalViews: { gt: 0 } },
      orderBy: { totalViews: 'desc' },
      select: { id: true, title: true, slug: true, coverUrl: true, description: true, authorName: true },
    }),
    prisma.mangaSeries.count({ where: whereActive }),
    prisma.user.count(),
    prisma.chapter.count(),
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es MangaAura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `MangaAura es una plataforma de manga con IA que cuenta con más de ${totalMangas.toLocaleString()} series de manga, ${totalChapters.toLocaleString()} capítulos publicados y una comunidad activa de más de ${totalReaders.toLocaleString()} lectores. Puedes leer mangas gratis, crear tus propias series con herramientas de IA, crowdfundear capítulos usando Aura y ganar XP mientras lees.`,        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo puedo crear mi propio manga?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crear tu propio manga en MangaAura es sencillo: regístrate como creador, accede al panel de creador y sube tus capítulos con portada y descripción. MangaAura ofrece herramientas potenciadas por IA para generar descripciones automáticas, traducciones a múltiples idiomas y recomendaciones inteligentes que aumentan la visibilidad de tu obra entre los lectores.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué es Aura y cómo funciona?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aura es la moneda virtual de MangaAura. Los lectores la usan para crowdfundear capítulos (apoyando económicamente a los creadores), dar propinas, patrocinar contenido exclusivo y participar en eventos especiales. Los creadores reciben Aura como recompensa por su trabajo, creando un ecosistema sostenible donde todos ganan.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Es gratis leer mangas en MangaAura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sí, leer mangas en MangaAura es completamente gratuito. Actualmente la plataforma alberga ${totalMangas.toLocaleString()} series con ${totalChapters.toLocaleString()} capítulos disponibles sin costo. Además, mientras lees acumulas XP, subes de nivel en más de 50 logros, mantienes rachas de lectura y apareces en los rankings globales. Todo 100% gratis, sin límites de lectura ni suscripciones obligatorias.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo funciona el crowdfunding de capítulos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El crowdfunding en MangaAura permite a los lectores contribuir con Aura directamente a los capítulos que quieren ver publicados. Cada capítulo tiene una meta de financiamiento. Cuando la comunidad alcanza la meta, el capítulo se libera para todos los lectores. Este sistema permite a los creadores recibir apoyo directo de su audiencia mientras mantienen el contenido accesible para toda la comunidad.',
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeContent
        latestMangas={latestMangas.map(normalizeManga)}
        topMangas={topMangas.map(normalizeManga)}
        updatingMangas={updatingMangas.map(normalizeManga)}
        topUsers={topUsers}
        featuredManga={featuredManga}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />
    </>
  );
}