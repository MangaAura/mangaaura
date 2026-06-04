'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';

import CommentDrawer from '@/components/Reader/CommentDrawer';
import { MangaReader } from '@/components/Reader/MangaReader';
import { useReadingAnalytics } from '@/hooks/useReadingAnalytics';
import { useT } from '@/i18n';

interface ChapterData {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  pageUrls: string[];
  viewCount: number;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorId: string;
    authorName: string;
  };
}

interface ChaptersListResponse {
  chapters: {
    id: string;
    chapterNumber: number;
    title: string | null;
  }[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return res.json();
};

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ReaderContent({ slug: slugProp, chapterNumber: chapterNumberProp }: { slug?: string | null; chapterNumber?: string | null } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mangaIdParam = searchParams.get('mangaId');
  const chapterNumber = chapterNumberProp || searchParams.get('chapterNumber');
  const chapterId = searchParams.get('chapterId');
  const mangaSlugParam = slugProp || searchParams.get('mangaSlug');

  const [, setCurrentPage] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [resolvedMangaId, setResolvedMangaId] = useState<string | null>(mangaSlugParam ? null : mangaIdParam);
  const [mangaSlug, setMangaSlug] = useState<string | null>(mangaSlugParam);
  const [resolvedChapterNumber, setResolvedChapterNumber] = useState<string | null>(chapterNumber);
  const [isResolving, setIsResolving] = useState(!!mangaSlugParam);

  // Resolve mangaSlug -> manga ID
  useEffect(() => {
    let mounted = true;
    if (!mangaSlugParam) return;
    const timer = setTimeout(() => {
      if (mounted) setIsResolving(true);
    }, 0);
    fetch(`/api/manga/${mangaSlugParam}`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data?.manga?.id) {
          setResolvedMangaId(data.manga.id);
          setMangaSlug(mangaSlugParam);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setIsResolving(false); });
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [mangaSlugParam]);

  // Resolve chapterId to mangaId + chapterNumber if needed
  useEffect(() => {
    let mounted = true;
    if (!chapterId || mangaSlugParam || mangaIdParam) return;
    const timer = setTimeout(() => {
      if (mounted) setIsResolving(true);
    }, 0);
    fetch(`/api/manga/chapters/${chapterId}`)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data?.manga?.id && data?.chapterNumber != null) {
          setResolvedMangaId(data.manga.id);
          setResolvedChapterNumber(String(data.chapterNumber));
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setIsResolving(false); });
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [chapterId, mangaIdParam, mangaSlugParam]);

  // Fetch chapter data
  const { data: chapterData, error: chapterError, isLoading: isLoadingChapter } = useSWR<ChapterData>(
    resolvedMangaId && resolvedChapterNumber ? `/api/manga/${resolvedMangaId}/chapters/${resolvedChapterNumber}` : null,
    fetcher
  );

  // Fetch chapters list for navigation
  const { data: chaptersList } = useSWR<ChaptersListResponse>(
    resolvedMangaId ? `/api/manga/${resolvedMangaId}/chapters` : null,
    fetcher
  );

  // Fetch user's chapter rating
  const { data: userChapterRating, mutate: mutateChapterRating } = useSWR<{ rating: number | null }>(
    () => chapterData?.id ? `/api/chapters/${chapterData.id}/rate` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [optimisticChapterRating, setOptimisticChapterRating] = useState<number | null>(null);
  const currentChapterRating = optimisticChapterRating ?? userChapterRating?.rating ?? null;
  const t = useT();

  const handleChapterRate = async (rating: number) => {
    if (!chapterData?.id) return;
    setOptimisticChapterRating(rating);
    try {
      const res = await fetch(`/api/chapters/${chapterData.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (res.status === 401) {
        setOptimisticChapterRating(null);
        router.push('/auth/login?message=loginToRate');
        return;
      }
      if (!res.ok) throw new Error(t('reviews.errorRating'));
      await mutateChapterRating();
    } catch {
      setOptimisticChapterRating(null);
    }
  };

  // Extract slug from chapter data once loaded (backward compat for mangaId-only URLs)
  useEffect(() => {
    if (!chapterData?.manga?.slug) return;
    if (chapterData.manga.slug !== mangaSlug) {
      queueMicrotask(() => setMangaSlug(chapterData.manga.slug));
    }
  }, [chapterData?.manga?.slug, mangaSlug]);

  // Analytics
  const { trackPageTurn: trackPageView } = useReadingAnalytics({
    mangaId: chapterData?.mangaId ?? '',
    chapterId: chapterData?.id ?? '',
    chapterNumber: chapterData?.chapterNumber ?? 1,
    totalPages: chapterData?.totalPages ?? 0,
  });

  // Track page views via MangaReader callback
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    trackPageView(page + 1);
  }, [trackPageView]);

  // Compute chapter navigation
  const currentChapterNumber = parseInt(resolvedChapterNumber || '1');
  const prevChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber - 1);
  const nextChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber + 1);

  // Handle loading and error states
  if (isLoadingChapter || isResolving) {
    return <LoadingSpinner />;
  }

  if (chapterError || !chapterData || !chapterData.manga) {
    return (
      <main id="main-content" className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Error al cargar el capítulo</p>
          <Link href="/explore" className="px-4 py-2 bg-[var(--primary-hover)] text-white rounded-lg hover:opacity-90 transition-opacity inline-block">
            Volver al explorar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* MangaReader takes over the full reading experience */}
      <MangaReader
        pages={chapterData.pageUrls}
        chapterNumber={chapterData.chapterNumber}
        mangaTitle={chapterData.manga.title}
        mangaSlug={mangaSlug || chapterData.manga.slug}
        mangaId={chapterData.mangaId}
        chapterId={chapterData.id}
        totalChapters={chaptersList?.chapters.length ?? 1}
        prevChapter={prevChapter ? { slug: mangaSlug || chapterData.manga.slug, chapterNumber: prevChapter.chapterNumber } : undefined}
        nextChapter={nextChapter ? { slug: mangaSlug || chapterData.manga.slug, chapterNumber: nextChapter.chapterNumber } : undefined}
        initialPage={0}

        // ReaderContent integration
        showComments={showComments}
        onToggleComments={() => setShowComments(v => !v)}
        commentCount={0}
        chapterRating={currentChapterRating}
        onChapterRate={handleChapterRate}
        isDarkMode={isDarkMode}
        onThemeChange={(dark) => setIsDarkMode(dark)}
        onPageChange={handlePageChange}
      />

      {/* Comments Sidebar – rendered outside MangaReader but connected via props */}
      {showComments && (
        <CommentDrawer
          chapterId={chapterData.id}
          mangaId={chapterData.mangaId}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  );
}
