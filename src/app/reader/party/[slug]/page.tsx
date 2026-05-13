/**
 * Party Reading Page
 *
 * Pagina para lectura en grupo usando el componente PartyReader.
 * Obtiene datos reales del capitulo desde la API.
 */

import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { partyService } from '@/core/services/PartyService';

const PartyReader = dynamic(() => import('@/components/Reader/PartyReader'), {
  loading: () => <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>,
});

interface PartyPageProps {
  params: Promise<{ slug: string }>;
}

const FALLBACK_PAGES = Array.from({ length: 10 }, () => `/placeholder-manga.svg`);

async function getChapterData(chapterId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/chapters/${chapterId}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PartyPage({ params }: PartyPageProps) {
  const { slug: partyId } = await params;

  const party = partyService.getParty(partyId);

  if (!party) {
    notFound();
  }

  const chapterData = await getChapterData(party.chapterId);

  const mangaTitle = chapterData?.manga?.title || 'Manga';
  const chapterNumber = chapterData?.chapterNumber || 1;
  const pages = chapterData?.pageUrls?.length > 0 ? chapterData.pageUrls : FALLBACK_PAGES;

  return (
    <PartyReader
      partyId={partyId}
      pages={pages}
      mangaId={party.mangaId}
      chapterId={party.chapterId}
      chapterNumber={chapterNumber}
      mangaTitle={mangaTitle}
    />
  );
}
