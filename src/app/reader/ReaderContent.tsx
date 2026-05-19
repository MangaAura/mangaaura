'use client';

import { ArrowLeft, MessageSquare, Maximize, Minimize, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';


// Components
import CommentDrawer from '@/components/Reader/CommentDrawer';
import PageViewer from '@/components/Reader/PageViewer';
import ReadingProgress from '@/components/Reader/ReadingProgress';

// Hooks
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

export default function ReaderContent() {
  const searchParams = useSearchParams();
  const mangaId = searchParams.get('mangaId');
  const chapterNumber = searchParams.get('chapterNumber');

  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode] = useState<'scroll' | 'paged'>('scroll');

  // Fetch chapter data
  const { data: chapterData, error: chapterError, isLoading: isLoadingChapter } = useSWR<ChapterData>(
    mangaId && chapterNumber ? `/api/manga/${mangaId}/chapters/${chapterNumber}` : null,
    fetcher
  );

  // Fetch chapters list for navigation
  const { data: chaptersList } = useSWR<ChaptersListResponse>(
    mangaId ? `/api/manga/${mangaId}/chapters` : null,
    fetcher
  );

  // Analytics
  const { trackPageTurn: trackPageView } = useReadingAnalytics({
    mangaId: chapterData?.mangaId ?? '',
    chapterId: chapterData?.id ?? '',
    chapterNumber: chapterData?.chapterNumber ?? 1,
    totalPages: chapterData?.totalPages ?? 0,
  });

  // Callbacks declared before effects that use them
  const nextPage = useCallback(() => {
    if (chapterData && currentPage < chapterData.totalPages - 1) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, chapterData]);

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
    if (chapterData) {
      trackPageView(currentPage + 1);
    }
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, toggleFullscreen]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle loading and error states
  if (isLoadingChapter) {
    return <LoadingSpinner />;
  }

  if (chapterError || !chapterData || !chapterData.manga) {
    return (
      <main id="main-content" className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Error al cargar el capítulo</p>
          <Link href="/browse">
            <button className="px-4 py-2 bg-[var(--primary-hover)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              Volver al explorar
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const currentChapterNumber = parseInt(chapterNumber || '1');
  const prevChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber - 1);
  const nextChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber + 1);

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
              href={prevChapter ? `/reader?mangaId=${mangaId}&chapterNumber=${prevChapter.chapterNumber}` : '#'}
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
              href={nextChapter ? `/reader?mangaId=${mangaId}&chapterNumber=${nextChapter.chapterNumber}` : '#'}
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
          if (chapter && mangaId) {
            window.location.href = `/reader?mangaId=${mangaId}&chapterNumber=${chapterNum}`;
          }
        }}
      />
    </div>
  );
}
