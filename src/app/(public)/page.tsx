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
  const [latestMangas, topMangas, updatingMangas, topUsers, featuredManga, totalMangas, totalReaders, totalChapters] = await Promise.all([
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 5,
      orderBy: { totalViews: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, totalViews: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
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
      where: { totalViews: { gt: 0 } },
      orderBy: { totalViews: 'desc' },
      select: { id: true, title: true, slug: true, coverUrl: true, description: true, authorName: true },
    }),
    prisma.mangaSeries.count(),
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
          text: 'MangaAura es una plataforma de manga con IA donde puedes leer mangas gratis, crear tus propias series, crowdfundear capítulos y ganar Aura por tu actividad.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo puedo crear mi propio manga?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sube tus capítulos desde el panel de creador. MangaAura te ofrece herramientas de IA para generar descripciones, traducciones y recomendaciones automáticas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué es Aura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aura es la moneda virtual de MangaAura. Los lectores pueden comprarla para crowdfundear capítulos, dar propinas a creadores y patrocinar contenido.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Es gratis leer mangas en MangaAura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, leer mangas en MangaAura es completamente gratuito. También puedes ganar XP, subir de nivel y desbloquear logros mientras lees.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo funciona el crowdfunding de capítulos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Los lectores pueden contribuir con Aura a los capítulos que quieren ver publicados. Cuando se alcanza la meta, el capítulo se libera para todos.',
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