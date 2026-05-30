import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import ReaderContent from './ReaderContent';

interface ReaderPageProps {
  searchParams: Promise<{ mangaSlug?: string; chapterNumber?: string; chapterId?: string }>;
}

export async function generateMetadata({ searchParams }: ReaderPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

  const title = sp.mangaSlug && sp.chapterNumber
    ? `Capítulo ${sp.chapterNumber} | MangaAura`
    : 'Lector | MangaAura';

  return {
    title,
    alternates: { canonical: `${baseUrl}/reader` },
    robots: { index: false },
  };
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default async function ReaderPage({ searchParams }: ReaderPageProps) {
  const sp = await searchParams;

  // Redirect to clean URL when possible
  if (sp.mangaSlug && sp.chapterNumber) {
    redirect(`/${sp.mangaSlug}-${sp.chapterNumber}`);
  }

  // For chapterId-only URLs (notifications, etc.), keep the /reader route
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReaderContent />
    </Suspense>
  );
}
