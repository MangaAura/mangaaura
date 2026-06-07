import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import ReaderContent from '@/app/reader/ReaderContent';
import { BreadcrumbStructuredData, ChapterStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ slugChapter: string }>;
}

/**
 * Parse a URL segment like "slug-del-manga-123" into { slug: "slug-del-manga", chapterNumber: "123" }.
 * Splits by the LAST hyphen — everything before is the slug, everything after is the chapter number.
 */
function parseSlugChapter(slugChapter: string): { slug: string; chapterNumber: string } | null {
  const lastHyphen = slugChapter.lastIndexOf('-');
  if (lastHyphen === -1 || lastHyphen === 0 || lastHyphen === slugChapter.length - 1) return null;
  const slug = slugChapter.slice(0, lastHyphen);
  const chapterNumber = slugChapter.slice(lastHyphen + 1);
  if (!chapterNumber || isNaN(Number(chapterNumber))) return null;
  return { slug, chapterNumber };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slugChapter } = await params;
  const parsed = parseSlugChapter(slugChapter);
  if (!parsed) return { title: 'Lector | MangaAura' };

  const { slug, chapterNumber } = parsed;
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.reader.title');
  const description = t('page.reader.description');
  const fullTitle = `${title} | MangaAura`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

  // Fetch manga + chapter info for richer metadata
  // Prefer chapter coverUrl over manga coverUrl for the OG image
  const mangaPromise = prisma.mangaSeries
    .findUnique({
      where: { slug },
      select: { id: true, title: true, coverUrl: true, description: true },
    })
    .catch(() => null);

  const chapterPromise = mangaPromise.then(async (manga) => {
    if (!manga) return null;
    return prisma.chapter
      .findFirst({
        where: { mangaId: manga.id, chapterNumber: Number(chapterNumber) },
        select: { coverUrl: true },
      })
      .catch(() => null);
  });

  const [manga, chapter] = await Promise.all([mangaPromise, chapterPromise]);

  const ogImage = chapter?.coverUrl || manga?.coverUrl || '/og-image.png';

  const pageTitle = manga
    ? `${manga.title} - Capítulo ${chapterNumber} | MangaAura`
    : fullTitle;

  return {
    title: pageTitle,
    description: manga?.description || description,
    alternates: { canonical: `${baseUrl}/${slugChapter}` },
    openGraph: {
      title: pageTitle,
      description: manga?.description || description,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: manga?.description || description,
      images: [ogImage],
    },
  };
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default async function ReaderPage({ params }: PageProps) {
  const { slugChapter } = await params;
  const parsed = parseSlugChapter(slugChapter);

  if (!parsed) notFound();

  const { slug, chapterNumber } = parsed;

  // Fetch manga + chapter data for structured data
  const manga = await prisma.mangaSeries.findUnique({
    where: { slug },
    select: { id: true, title: true, authorName: true },
  });

  const chapter = manga ? await prisma.chapter.findFirst({
    where: { mangaId: manga.id, chapterNumber: Number(chapterNumber) },
    select: { id: true, title: true, createdAt: true, totalPages: true, coverUrl: true },
  }) : null;

  return (
    <>
      {manga && chapter && (
        <>
          <ChapterStructuredData
            title={chapter.title || `Capítulo ${chapterNumber}`}
            chapterNumber={Number(chapterNumber)}
            mangaTitle={manga.title}
            mangaSlug={slug}
            author={manga.authorName || 'MangaAura'}
            coverUrl={chapter.coverUrl || undefined}
            publishedAt={chapter.createdAt.toISOString()}
            pageCount={chapter.totalPages}
          />
          <BreadcrumbStructuredData
            items={[
              { name: 'Inicio', item: '/' },
              { name: 'Explorar', item: '/explore' },
              { name: manga.title, item: `/manga/${slug}` },
              { name: `Capítulo ${chapterNumber}`, item: `/${slugChapter}` },
            ]}
          />
        </>
      )}
      <Suspense fallback={<LoadingSpinner />}>
        <ReaderContent slug={slug} chapterNumber={chapterNumber} />
      </Suspense>
    </>
  );
}
