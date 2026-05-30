'use client';

import { ArrowLeft, MessageSquare, Maximize, Minimize, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';

import CommentDrawer from '@/components/Reader/CommentDrawer';
import PageViewer from '@/components/Reader/PageViewer';
import ReadingProgress from '@/components/Reader/ReadingProgress';
import { useReadingAnalytics } from '@/hooks/useReadingAnalytics';
import { cn } from '@/lib/utils';

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

  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode] = useState<'scroll' | 'paged'>('scroll');
  const [resolvedMangaId, setResolvedMangaId] = useState<string | null>(mangaSlugParam ? null : mangaIdParam);
  const [mangaSlug, setMangaSlug] = useState<string | null>(mangaSlugParam);
  const [resolvedChapterNumber, setResolvedChapterNumber] = useState<string | null>(chapterNumber);
  const [isResolving, setIsResolving] = useState(!!mangaSlugParam);

  // Resolve mangaSlug → manga ID

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

  const [continuousReading, setContinuousReading] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('mangaaura-continuous-reading') === 'true'; } catch { return false; }
  });
  const continuousNavPending = useRef(false);

  // Persist continuous reading preference
  useEffect(() => {
    try { localStorage.setItem('mangaaura-continuous-reading', String(continuousReading)); } catch { /* noop */ }
  }, [continuousReading]);

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

  // Extract slug from chapter data once loaded (backward compat for mangaId-only URLs)

  useEffect(() => {
    if (!chapterData?.manga?.slug) return;
    if (chapterData.manga.slug !== mangaSlug) {
      setMangaSlug(chapterData.manga.slug);
    }
  }, [chapterData?.manga?.slug, mangaSlug]);

  // Analytics
  const { trackPageTurn: trackPageView } = useReadingAnalytics({
    mangaId: chapterData?.mangaId ?? '',
    chapterId: chapterData?.id ?? '',
    chapterNumber: chapterData?.chapterNumber ?? 1,
    totalPages: chapterData?.totalPages ?? 0,
  });

  // Compute chapter navigation (must be before callbacks that use them)
  const currentChapterNumber = parseInt(resolvedChapterNumber || '1');
  const prevChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber - 1);
  const nextChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber + 1);

  // Callbacks declared before effects that use them
  const nextPage = useCallback(() => {
    if (!chapterData) return;
    const isLastPage = currentPage >= chapterData.totalPages - 1;
    
    // Continuous reading: auto-advance to next chapter
    if (isLastPage && continuousReading && nextChapter && resolvedMangaId && !continuousNavPending.current) {
      continuousNavPending.current = true;
    router.push(`/${mangaSlug || resolvedMangaId}-${nextChapter.chapterNumber}`);
      return;
    }
    
    if (currentPage < chapterData.totalPages - 1) {
      setCurrentPage(p => p + 1);
    }
     
  }, [currentPage, chapterData, continuousReading, nextChapter, mangaSlug, resolvedMangaId, router]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (!chapterData) return;
    trackPageView(currentPage + 1);
  }, [currentPage, chapterData, trackPageView]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setContinuousReading(v => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, toggleFullscreen]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle loading and error states
  if (isLoadingChapter || isResolving) {
    return <LoadingSpinner />;
  }

  if (chapterError || !chapterData || !chapterData.manga) {
    return (
      <main id="main-content" className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Error al cargar el capítulo</p>
          <Link href="/explore">
            <button className="px-4 py-2 bg-[var(--primary-hover)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              Volver al explorar
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[var(--background)]' : 'bg-[var(--surface-elevated)]'}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border-strong)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/manga/${chapterData.manga.slug}`}>
              <button className="p-2 hover:bg-[var(--surface)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" aria-label="Volver al manga">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-sm font-medium text-[var(--text-primary)] truncate max-w-xs">
                {chapterData.manga.title}
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Capítulo {chapterData.chapterNumber}
                {chapterData.title && ` - ${chapterData.title}`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "p-2 rounded-lg transition-colors cursor-pointer",
            showComments ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
          )}
          aria-label={showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'}
        >
              <MessageSquare className="w-5 h-5" />
            </button>
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
          aria-label={isDarkMode ? 'Tema claro' : 'Tema oscuro'}
        >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="pt-14 flex">
        {/* Reader */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          showComments ? "mr-80" : ""
        )}>
          {/* Page Viewer */}
          <PageViewer
            pages={chapterData.pageUrls}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            viewMode={viewMode}
            onNext={nextPage}
            onPrev={prevPage}
          />

          {/* Navigation Controls */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-[var(--background)]/90 backdrop-blur px-4 py-2 rounded-full border border-[var(--border-strong)]">
            <Link
              href={prevChapter && (mangaSlug || resolvedMangaId) ? `/${mangaSlug || resolvedMangaId}-${prevChapter.chapterNumber}` : '#'}
              className={cn(
                "p-2 rounded-full transition-colors",
                prevChapter
                  ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  : "text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <span className="text-sm text-[var(--text-primary)] min-w-[80px] text-center">
              {currentPage + 1} / {chapterData.totalPages}
            </span>

            <Link
              href={nextChapter && (mangaSlug || resolvedMangaId) ? `/${mangaSlug || resolvedMangaId}-${nextChapter.chapterNumber}` : '#'}
              className={cn(
                "p-2 rounded-full transition-colors",
                nextChapter
                  ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  : "text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <CommentDrawer
            chapterId={chapterData.id}
            mangaId={chapterData.mangaId}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        )}
      </main>

      {/* Reading Progress */}
      <ReadingProgress
        currentChapter={chapterData.chapterNumber}
        totalChapters={chaptersList?.chapters.length ?? 1}
        chapters={chaptersList?.chapters.map(c => ({ id: c.id, number: c.chapterNumber, title: c.title })) ?? []}
        mangaId={chapterData.mangaId}
        currentPage={currentPage}
        totalPages={chapterData.totalPages}
        onChapterChange={(chapterNum) => {
            const chapter = chaptersList?.chapters.find(c => c.chapterNumber === chapterNum);
            if (chapter && (mangaSlug || resolvedMangaId)) {
              window.location.href = `/${mangaSlug || resolvedMangaId}-${chapterNum}`;
          }
        }}
      />
    </div>
  );
}
