/**
 * MangaReader Component
 *
 * Lector de mangas con UX mejorada: zoom, navegaci�n fluida, atajos.
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
  Menu,
  Columns,
  LayoutList,
  HelpCircle,
  MousePointerClick,
  Crown,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAutoSaveProgress } from '@/hooks/useReadingProgress';
import dynamic from 'next/dynamic';
import EditorModeOverlay from '@/components/Reader/EditorModeOverlay';

const QuizPopup = dynamic(() => import('@/components/Reader/QuizPopup'), { ssr: false });
const SponsorshipModal = dynamic(() => import('@/components/Reader/SponsorshipModal'), { ssr: false });
const MemeGeneratorModal = dynamic(() => import('@/components/Reader/MemeGeneratorModal'), { ssr: false });

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
        alt={`P�gina ${index + 1}`}
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
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  const [showMeme, setShowMeme] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const preloadedPages = useRef<Set<number>>(new Set());

  // Auto-save progress - only update when actually needed
  useAutoSaveProgress(mangaId, chapterId, currentPage, pages.length);

  // Preload adjacent pages - memoized to prevent unnecessary runs
  const preloadAdjacentPages = useCallback(() => {
    const pagesToPreload = [currentPage - 1, currentPage + 1].filter(
      p => p >= 0 && p < pages.length && !preloadedPages.current.has(p)
    );

    pagesToPreload.forEach(p => {
      const img = new (Image as unknown as { new (): HTMLImageElement })();
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
    const step = viewMode === 'double' ? 2 : 1;
    if (currentPage < pages.length - step) {
      setCurrentPage(p => p + step);
      scrollToTop();
      setIsLoading(true);
    } else if (nextChapter) {
      window.location.href = `/manga/${mangaSlug}/${nextChapter.chapterNumber}`;
    }
  }, [currentPage, pages.length, nextChapter, mangaSlug, scrollToTop, viewMode]);

  const prevPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    if (currentPage >= step) {
      setCurrentPage(p => p - step);
      scrollToTop();
      setIsLoading(true);
    } else if (prevChapter) {
      window.location.href = `/manga/${mangaSlug}/${prevChapter.chapterNumber}`;
    }
  }, [currentPage, prevChapter, mangaSlug, scrollToTop, viewMode]);

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
        setShowQuiz(false);
        setShowEditor(false);
        setShowSponsor(false);
        setShowMeme(false);
        break;
      case 'w':
      case 'W':
        e.preventDefault();
        setViewMode(v => v === 'single' ? 'double' : 'single');
        break;
    }
  }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom, toggleControls, readingDirection]);

  // Touch handlers with pinch-to-zoom support
  const getPinchDistance = useCallback((touches: React.TouchList | TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDistance.current = getPinchDistance(e.touches);
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, [getPinchDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current > 0) {
      const newDist = getPinchDistance(e.touches);
      const scale = newDist / lastPinchDistance.current;
      const newZoom = Math.max(50, Math.min(200, Math.round(zoom * scale)));
      setZoom(newZoom);
      lastPinchDistance.current = newDist;
    }
  }, [zoom, getPinchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      lastPinchDistance.current = 0;
    }
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;
    const threshold = 50;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        if (readingDirection === 'ltr') {
          nextPage();
        } else {
          prevPage();
        }
      } else {
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
  'aria-label': ariaLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded-lg transition-colors cursor-pointer',
        disabled
        ? 'text-[var(--text-muted)] cursor-not-allowed'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-inverse)]/10'
      )}
      title={title}
      aria-label={ariaLabel || title}
    >
      {children}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)]" ref={containerRef}>
      {/* Fixed Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-b border-[var(--text-inverse)]/10',
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
              <h1 className="text-[var(--text-primary)] font-medium truncate max-w-xs">
                {mangaTitle}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Cap�tulo {chapterNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
        <ControlButton onClick={zoomOut} title="Alejar" aria-label="Alejar">
          <ZoomOut className="w-5 h-5" />
        </ControlButton>
        <span className="text-[var(--text-secondary)] text-sm min-w-[3rem] text-center">
          {zoom}%
        </span>
        <ControlButton onClick={zoomIn} title="Acercar" aria-label="Acercar">
          <ZoomIn className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={resetZoom} title="Reset zoom" aria-label="Restablecer zoom">
          <RotateCcw className="w-5 h-5" />
        </ControlButton>
        <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
              <ControlButton onClick={() => setViewMode(v => v === 'single' ? 'double' : 'single')} title="Modo de vista (W)" aria-label="Modo de vista">
                {viewMode === 'single' ? <Columns className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
              </ControlButton>
              <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
              <ControlButton onClick={() => setShowQuiz(true)} title="Pop Quiz" aria-label="Pop Quiz">
                <HelpCircle className="w-5 h-5" />
              </ControlButton>
              <ControlButton onClick={() => setShowEditor(true)} title="Modo Edici�n" aria-label="Modo Edici�n">
                <MousePointerClick className="w-5 h-5" />
              </ControlButton>
              <ControlButton onClick={() => setShowSponsor(true)} title="Patrocinar" aria-label="Patrocinar">
                <Crown className="w-5 h-5" />
              </ControlButton>
              <ControlButton onClick={() => setShowMeme(true)} title="Generar Meme" aria-label="Generar Meme">
                <Type className="w-5 h-5" />
              </ControlButton>
              <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
              <ControlButton onClick={() => setShowSettings(true)} title="Ajustes" aria-label="Ajustes">
          <Settings className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={() => setShowHelp(true)} title="Ayuda (?)" aria-label="Ayuda">
          <Keyboard className="w-5 h-5" />
        </ControlButton>
        <ControlButton onClick={toggleControls} title="Ocultar (Espacio)" aria-label="Ocultar controles">
          <Maximize className="w-5 h-5" />
        </ControlButton>
          </div>
        </div>
      </header>

      {/* Main Reader */}
      <main
        className="pt-14 pb-20 min-h-screen flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative max-w-full max-h-screen overflow-auto"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {viewMode === 'double' ? (
            // Double-page view
            (() => {
              const leftPageIndex = currentPage % 2 === 0 ? currentPage : currentPage - 1;
              const rightPageIndex = leftPageIndex + 1;

              return (
                <div className="flex justify-center gap-0.5" style={{ minHeight: '90vh' }}>
                  {leftPageIndex >= 0 && leftPageIndex < pages.length && (
                    <img
                      src={pages[leftPageIndex]}
                      alt={`P�gina ${leftPageIndex + 1}`}
                      className="max-w-[48vw] max-h-screen object-contain cursor-pointer select-none"
                      onClick={handleImageClick}
                      style={{ display: isLoading ? 'none' : 'block' }}
                    />
                  )}
                  {rightPageIndex < pages.length && (
                    <img
                      src={pages[rightPageIndex]}
                      alt={`P�gina ${rightPageIndex + 1}`}
                      className="max-w-[48vw] max-h-screen object-contain cursor-pointer select-none"
                      onClick={handleImageClick}
                      style={{ display: isLoading ? 'none' : 'block' }}
                    />
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[var(--text-inverse)]/20 border-t-[var(--text-inverse)] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            // Single-page view
            pages.map((page, index) => (
              <div
                key={`page-${index}`}
                className={cn(
                  'flex justify-center',
                  index !== currentPage && 'hidden'
                )}
              >
                <img
                  ref={index === currentPage ? imageRef : undefined}
                  src={page}
                  alt={`P�gina ${index + 1}`}
                  className="max-w-full max-h-screen object-contain cursor-pointer select-none"
                  onClick={handleImageClick}
                  onLoad={() => setIsLoading(false)}
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[var(--text-inverse)]/20 border-t-[var(--text-inverse)] rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Navigation Zones */}
          <button
            aria-label="P�gina anterior"
            tabIndex={0}
            className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize opacity-0 hover:opacity-10 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => readingDirection === 'ltr' ? prevPage() : nextPage()}
          />
          <button
            aria-label="P�gina siguiente"
            tabIndex={0}
            className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize opacity-0 hover:opacity-10 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => readingDirection === 'ltr' ? nextPage() : prevPage()}
          />
        </div>
      </main>

      {/* Fixed Footer */}
      <footer
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-t border-[var(--text-inverse)]/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-1 bg-[var(--text-inverse)]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
        <Button variant="ghost" size="sm" onClick={zoomOut} aria-label="Alejar">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-[var(--text-secondary)] min-w-[3rem] text-center">
          {zoom}%
        </span>
        <Button variant="ghost" size="sm" onClick={zoomIn} aria-label="Acercar">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={resetZoom} aria-label="Restablecer zoom">
          <RotateCcw className="w-4 h-4" />
        </Button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
{prevChapter && (
          <Link href={`/manga/${mangaSlug}/${prevChapter.chapterNumber}`}>
            <Button variant="ghost" size="sm" aria-label="Cap�tulo anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        )}
        <ControlButton
          onClick={prevPage}
          disabled={currentPage === 0}
          title="P�gina anterior (?)"
          aria-label="P�gina anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </ControlButton>
        <span className="text-[var(--text-secondary)] text-sm min-w-[4rem] text-center">
          {progress.current} / {progress.total}
        </span>
        <ControlButton
          onClick={nextPage}
          disabled={currentPage === pages.length - 1 && !nextChapter}
          title="P�gina siguiente (?)"
          aria-label="P�gina siguiente"
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
                  Cap�tulos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-sunken)]/80">
          <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ajustes de lectura</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Reading Direction */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Direcci�n de lectura
                </label>
                <div className="flex gap-2">
                  {(['ltr', 'rtl'] as const).map((dir) => (
                    <Button
                      key={dir}
                      variant={readingDirection === dir ? 'default' : 'outline'}
                      onClick={() => setReadingDirection(dir)}
                      className="flex-1"
                    >
                      {dir === 'ltr' ? 'Izquierda ? Derecha' : 'Derecha ? Izquierda'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Modo de vista
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setViewMode('single')}
                    className="flex-1"
                  >
                    <LayoutList className="w-4 h-4 mr-1" /> P�gina simple
                  </Button>
                  <Button
                    variant={viewMode === 'double' ? 'default' : 'outline'}
                    onClick={() => setViewMode('double')}
                    className="flex-1"
                  >
                    <Columns className="w-4 h-4 mr-1" /> Doble p�gina
                  </Button>
                </div>
              </div>

              {/* Chapter Info */}
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Cap�tulos disponibles: {totalChapters}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-sunken)]/80">
          <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Atajos de teclado</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">? / ?</span>
                <span className="text-[var(--text-primary)]">P�gina anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">A / D</span>
                <span className="text-[var(--text-primary)]">P�gina anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">? / ?</span>
                <span className="text-[var(--text-primary)]">Zoom in / out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">0</span>
                <span className="text-[var(--text-primary)]">Reset zoom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Espacio</span>
                <span className="text-[var(--text-primary)]">Mostrar/ocultar controles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">?</span>
                <span className="text-[var(--text-primary)]">Mostrar ayuda</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">W</span>
                <span className="text-[var(--text-primary)]">Cambiar modo de vista</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Esc</span>
                <span className="text-[var(--text-primary)]">Cerrar modales</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Tambi�n puedes hacer clic en los lados de la imagen para navegar.
              </p>
            </div>
          </div>
        </div>
      )}

      <QuizPopup
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        chapterTitle={`${mangaTitle} - Cap�tulo ${chapterNumber}`}
        chapterId={chapterId}
      />

      <EditorModeOverlay
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        imageUrl={pages[currentPage] || ''}
        chapterId={chapterId}
        pageNumber={currentPage + 1}
      />

      <SponsorshipModal
        isOpen={showSponsor}
        onClose={() => setShowSponsor(false)}
        chapterTitle={`${mangaTitle} - Cap�tulo ${chapterNumber}`}
        chapterId={chapterId}
      />

      <MemeGeneratorModal
        isOpen={showMeme}
        onClose={() => setShowMeme(false)}
        imageUrl={pages[currentPage] || ''}
        chapterId={chapterId}
        mangaTitle={mangaTitle}
        chapterNumber={chapterNumber}
      />
    </div>
  );
});

export default MangaReader;
