/**
 * MangaReader Component
 *
 * Lector de mangas con UX mejorada: zoom, navegación fluida, atajos.
 * Optimizado con React.memo, useMemo y useCallback para evitar re-renders innecesarios.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  BookOpen,
  Settings,
  X,
  Keyboard,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAutoSaveProgress } from '@/hooks/useReadingProgress';

// Memoized page image component to prevent re-renders
const PageImage = memo(function PageImage({
  page,
  index,
  currentPage,
  imageRef,
  isLoading,
  onLoad,
  onClick,
  zoom,
}: {
  page: string;
  index: number;
  currentPage: number;
  imageRef: React.RefObject<HTMLImageElement | null>;
  isLoading: boolean;
  onLoad: () => void;
  onClick: (e: React.MouseEvent) => void;
  zoom: number;
}) {
  const isCurrent = index === currentPage;
  const isPreload = Math.abs(index - currentPage) <= 2;

  if (!isCurrent && !isPreload) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex justify-center',
        !isCurrent && 'hidden'
      )}
      style={{
        minHeight: '100vh',
        padding: '1rem',
      }}
    >
      <Image
        ref={isCurrent ? imageRef : undefined}
        src={page}
        alt={`Página ${index + 1}`}
        fill
        priority={isCurrent}
        className={cn(
          'object-contain transition-all duration-200',
          isLoading && 'opacity-0'
        )}
        style={{
          transform: `scale(${zoom / 100})`,
        }}
        onLoad={onLoad}
        onClick={onClick}
        sizes="100vw"
      />
    </div>
  );
});

interface MangaReaderProps {
  pages: string[];
  chapterNumber: number;
  mangaTitle: string;
  mangaSlug: string;
  mangaId: string;
  chapterId: string;
  totalChapters: number;
  prevChapter?: { slug: string; chapterNumber: number };
  nextChapter?: { slug: string; chapterNumber: number };
  initialPage?: number;
  savedProgress?: { page: number; percentage: number };
}

export const MangaReader = memo(function MangaReader({
  pages,
  chapterNumber,
  mangaTitle,
  mangaSlug,
  mangaId,
  chapterId,
  totalChapters,
  prevChapter,
  nextChapter,
  initialPage = 0,
  savedProgress,
}: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [readingDirection, setReadingDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartX = useRef<number>(0);
  const preloadedPages = useRef<Set<number>>(new Set());

  // Auto-save progress - only update when actually needed
  useAutoSaveProgress(mangaId, chapterId, currentPage, pages.length);

  // Preload adjacent pages - memoized to prevent unnecessary runs
  const preloadAdjacentPages = useCallback(() => {
    const pagesToPreload = [currentPage - 1, currentPage + 1].filter(
      p => p >= 0 && p < pages.length && !preloadedPages.current.has(p)
    );

    pagesToPreload.forEach(p => {
      const img = new Image();
      img.src = pages[p];
      preloadedPages.current.add(p);
    });
  }, [currentPage, pages]);

  useEffect(() => {
    preloadAdjacentPages();
  }, [preloadAdjacentPages]);

  // Memoized navigation functions
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
      scrollToTop();
      setIsLoading(true);
    } else if (nextChapter) {
      window.location.href = `/manga/${mangaSlug}/${nextChapter.chapterNumber}`;
    }
  }, [currentPage, pages.length, nextChapter, mangaSlug, scrollToTop]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      scrollToTop();
      setIsLoading(true);
    } else if (prevChapter) {
      window.location.href = `/manga/${mangaSlug}/${prevChapter.chapterNumber}`;
    }
  }, [currentPage, prevChapter, mangaSlug, scrollToTop]);

  const zoomIn = useCallback(() => setZoom(z => Math.min(200, z + 25)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(50, z - 25)), []);
  const resetZoom = useCallback(() => setZoom(100), []);
  const toggleControls = useCallback(() => setShowControls(c => !c), []);

  // Keyboard navigation - memoized handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        if (readingDirection === 'ltr') {
          nextPage();
        } else {
          prevPage();
        }
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        if (readingDirection === 'ltr') {
          prevPage();
        } else {
          nextPage();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        zoomIn();
        break;
      case 'ArrowDown':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
      case ' ':
        e.preventDefault();
        toggleControls();
        break;
      case '?':
        e.preventDefault();
        setShowHelp(h => !h);
        break;
      case 'Escape':
        setShowHelp(false);
        setShowSettings(false);
        break;
    }
  }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom, toggleControls, readingDirection]);

  // Touch navigation - memoized handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next page (LTR) or prev page (RTL)
        if (readingDirection === 'ltr') {
          nextPage();
        } else {
          prevPage();
        }
      } else {
        // Swipe right - prev page (LTR) or next page (RTL)
        if (readingDirection === 'ltr') {
          prevPage();
        } else {
          nextPage();
        }
      }
    }
  }, [nextPage, prevPage, readingDirection]);

  // Image click handler
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const clickThreshold = width * 0.3;

    if (x < clickThreshold) {
      // Click on left side - previous page (LTR) or next page (RTL)
      if (readingDirection === 'ltr') {
        prevPage();
      } else {
        nextPage();
      }
    } else if (x > width - clickThreshold) {
      // Click on right side - next page (LTR) or previous page (RTL)
      if (readingDirection === 'ltr') {
        nextPage();
      } else {
        prevPage();
      }
    }
  }, [nextPage, prevPage, readingDirection]);

  // Keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Memoized progress calculation
  const progress = useMemo(() => ({
    current: currentPage + 1,
    total: pages.length,
    percentage: Math.round(((currentPage + 1) / pages.length) * 100),
  }), [currentPage, pages.length]);

  // Memoized button component
  const ControlButton = memo(function ControlButton({
    onClick,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'p-2 rounded-lg transition-colors',
          disabled
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        )}
        title={title}
      >
        {children}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-black" ref={containerRef}>
      {/* Fixed Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/manga/${mangaSlug}`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-white font-medium truncate max-w-xs">
                {mangaTitle}
              </h1>
              <p className="text-slate-400 text-sm">
                Capítulo {chapterNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ControlButton onClick={zoomOut} title="Alejar">
              <ZoomOut className="w-5 h-5" />
            </ControlButton>
            <span className="text-slate-400 text-sm min-w-[3rem] text-center">
              {zoom}%
            </span>
            <ControlButton onClick={zoomIn} title="Acercar">
              <ZoomIn className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={resetZoom} title="Reset zoom">
              <RotateCcw className="w-5 h-5" />
            </ControlButton>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <ControlButton onClick={() => setShowSettings(true)} title="Ajustes">
              <Settings className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={() => setShowHelp(true)} title="Ayuda (?)">
              <Keyboard className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={toggleControls} title="Ocultar (Espacio)">
              <Maximize className="w-5 h-5" />
            </ControlButton>
          </div>
        </div>
      </header>

      {/* Main Reader */}
      <main
        className="pt-14 pb-20 min-h-screen flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative max-w-full max-h-screen overflow-auto"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          {pages.map((page, index) => (
            <div
              key={index}
              className={cn(
                'flex justify-center',
                index !== currentPage && 'hidden'
              )}
            >
              <img
                ref={index === currentPage ? imageRef : undefined}
                src={page}
                alt={`Página ${index + 1}`}
                className="max-w-full max-h-screen object-contain cursor-pointer select-none"
                onClick={handleImageClick}
                onLoad={() => setIsLoading(false)}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}

          {/* Navigation Zones */}
          <div
            className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize opacity-0 hover:opacity-10 transition-opacity"
            onClick={() => readingDirection === 'ltr' ? prevPage() : nextPage()}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize opacity-0 hover:opacity-10 transition-opacity"
            onClick={() => readingDirection === 'ltr' ? nextPage() : prevPage()}
          />
        </div>
      </main>

      {/* Fixed Footer */}
      <footer
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-t border-white/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button variant="ghost" size="sm" onClick={zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-400 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetZoom}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              {prevChapter && (
                <Link href={`/manga/${mangaSlug}/${prevChapter.chapterNumber}`}>
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <ControlButton
                onClick={prevPage}
                disabled={currentPage === 0}
                title="Página anterior (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </ControlButton>
              <span className="text-slate-300 text-sm min-w-[4rem] text-center">
                {progress.current} / {progress.total}
              </span>
              <ControlButton
                onClick={nextPage}
                disabled={currentPage === pages.length - 1 && !nextChapter}
                title="Página siguiente (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </ControlButton>
              {nextChapter && (
                <Link href={`/manga/${mangaSlug}/${nextChapter.chapterNumber}`}>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                    Siguiente
                  </Button>
                </Link>
              )}
            </div>

            {/* Chapter Navigation */}
            <div className="flex items-center gap-2">
              <Link href={`/manga/${mangaSlug}`}>
                <Button variant="ghost" size="sm">
                  <Menu className="w-4 h-4 mr-1" />
                  Capítulos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Ajustes de lectura</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Reading Direction */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Dirección de lectura
                </label>
                <div className="flex gap-2">
                  {(['ltr', 'rtl'] as const).map((dir) => (
                    <Button
                      key={dir}
                      variant={readingDirection === dir ? 'default' : 'outline'}
                      onClick={() => setReadingDirection(dir)}
                      className="flex-1"
                    >
                      {dir === 'ltr' ? 'Izquierda → Derecha' : 'Derecha → Izquierda'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Chapter Info */}
              <div>
                <p className="text-sm text-slate-400">Capítulos disponibles: {totalChapters}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Atajos de teclado</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">← / →</span>
                <span className="text-white">Página anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">A / D</span>
                <span className="text-white">Página anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">↑ / ↓</span>
                <span className="text-white">Zoom in / out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">0</span>
                <span className="text-white">Reset zoom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Espacio</span>
                <span className="text-white">Mostrar/ocultar controles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">?</span>
                <span className="text-white">Mostrar ayuda</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Esc</span>
                <span className="text-white">Cerrar modales</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                También puedes hacer clic en los lados de la imagen para navegar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MangaReader;
