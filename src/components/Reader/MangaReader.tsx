'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
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
  Infinity,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';

import FocusLock from 'react-focus-lock';

import { PageJumpInput } from './PageJumpInput';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import EditorModeOverlay from '@/components/Reader/EditorModeOverlay';
import { Button } from '@/components/ui/Button';
import { useAutoSaveProgress } from '@/hooks/useReadingProgress';
import { cn } from '@/lib/utils';

const QuizPopup = dynamic(() => import('@/components/Reader/QuizPopup'), { ssr: false });
const SponsorshipModal = dynamic(() => import('@/components/Reader/SponsorshipModal'), { ssr: false });
const MemeGeneratorModal = dynamic(() => import('@/components/Reader/MemeGeneratorModal'), { ssr: false });

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
}: MangaReaderProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [readingDirection, setReadingDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [scrollMode, setScrollMode] = useState<'single' | 'continuous'>('single');
  const [continuousReading, setContinuousReading] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('mangaaura-continuous-reading') === 'true'; } catch { return false; }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  const [showMeme, setShowMeme] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const preloadedPages = useRef<Set<number>>(new Set());
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const continuousNavPending = useRef(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useAutoSaveProgress(mangaId, chapterId, currentPage, pages.length);

  // Persist continuous reading preference
  useEffect(() => {
    try { localStorage.setItem('mangaaura-continuous-reading', String(continuousReading)); } catch { /* noop */ }
  }, [continuousReading]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToChapter = useCallback((chapterNum: number) => {
    router.push(`/manga/${mangaSlug}/${chapterNum}`);
  }, [router, mangaSlug]);

  // Preload adjacent pages
  const preloadAdjacentPages = useCallback(() => {
    const pagesToPreload = [currentPage - 1, currentPage + 1].filter(
      p => p >= 0 && p < pages.length && !preloadedPages.current.has(p)
    );
    pagesToPreload.forEach(p => {
      const img = document.createElement('img');
      img.src = pages[p];
      preloadedPages.current.add(p);
    });
  }, [currentPage, pages]);

  useEffect(() => {
    preloadAdjacentPages();
  }, [preloadAdjacentPages]);

  // IntersectionObserver for continuous reading in scroll mode
  useEffect(() => {
    if (scrollMode !== 'continuous' || !continuousReading || !nextChapter) return;
    
    const lastPageEl = lastPageRef.current;
    if (!lastPageEl) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !continuousNavPending.current) {
          // Last page visible for 800ms → auto-advance
          autoAdvanceTimer.current = setTimeout(() => {
            if (continuousReading && nextChapter && !continuousNavPending.current) {
              continuousNavPending.current = true;
              navigateToChapter(nextChapter.chapterNumber);
            }
          }, 800);
        } else {
          // User scrolled away — cancel pending auto-advance
          if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = undefined;
          }
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(lastPageEl);
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = undefined;
      }
      observer.disconnect();
    };
  }, [scrollMode, continuousReading, nextChapter, navigateToChapter]);

  const nextPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    const isLastPage = currentPage >= pages.length - step;
    
    // Continuous reading: auto-advance to next chapter
    if (isLastPage && continuousReading && nextChapter && !continuousNavPending.current) {
      continuousNavPending.current = true;
      navigateToChapter(nextChapter.chapterNumber);
      return;
    }
    
    if (scrollMode === 'continuous') {
      const next = currentPage + 1;
      if (next < pages.length) {
        const el = containerRef.current?.children[next] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(next);
      } else if (nextChapter && !continuousReading) {
        window.location.href = `/manga/${mangaSlug}/${nextChapter.chapterNumber}`;
      }
    } else if (currentPage < pages.length - step) {
      setCurrentPage(p => p + step);
      scrollToTop();
      setIsLoading(true);
    } else if (nextChapter && !continuousReading) {
      window.location.href = `/manga/${mangaSlug}/${nextChapter.chapterNumber}`;
    }
  }, [currentPage, pages.length, nextChapter, mangaSlug, scrollToTop, viewMode, scrollMode, continuousReading, navigateToChapter]);

  const prevPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    if (scrollMode === 'continuous') {
      const prev = currentPage - 1;
      if (prev >= 0) {
        const el = containerRef.current?.children[prev] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(prev);
      } else if (prevChapter) {
        window.location.href = `/manga/${mangaSlug}/${prevChapter.chapterNumber}`;
      }
    } else if (currentPage >= step) {
      setCurrentPage(p => p - step);
      scrollToTop();
      setIsLoading(true);
    } else if (prevChapter) {
      window.location.href = `/manga/${mangaSlug}/${prevChapter.chapterNumber}`;
    }
  }, [currentPage, prevChapter, mangaSlug, scrollToTop, viewMode, scrollMode]);

  const zoomIn = useCallback(() => setZoom(z => {
    const idx = ZOOM_STEPS.indexOf(z);
    if (idx < ZOOM_STEPS.length - 1) return ZOOM_STEPS[idx + 1];
    return z;
  }), []);
  const zoomOut = useCallback(() => setZoom(z => {
    const idx = ZOOM_STEPS.indexOf(z);
    if (idx > 0) return ZOOM_STEPS[idx - 1];
    return z;
  }), []);
  const resetZoom = useCallback(() => setZoom(1), []);
  const toggleControls = useCallback(() => setShowControls(c => !c), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
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
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        setScrollMode(m => m === 'single' ? 'continuous' : 'single');
        break;
      case 'i':
      case 'I':
        e.preventDefault();
        setContinuousReading(v => !v);
        break;
      case '?':
        e.preventDefault();
        setShowHelp(h => !h);
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
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
  }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom, toggleControls, toggleFullscreen, readingDirection]);

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
      const targetZoom = zoom * scale;
      const idx = ZOOM_STEPS.reduce((prev, curr, i) =>
        Math.abs(curr - targetZoom) < Math.abs(ZOOM_STEPS[prev] - targetZoom) ? i : prev
      , 0);
      setZoom(ZOOM_STEPS[idx]);
      lastPinchDistance.current = newDist;
    }
  }, [zoom, getPinchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      lastPinchDistance.current = 0;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      setZoom(z => z === 1 ? 1.5 : 1);
      return;
    }
    lastTapRef.current = now;

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

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const clickThreshold = width * 0.3;

    if (x < clickThreshold) {
      if (readingDirection === 'ltr') {
        prevPage();
      } else {
        nextPage();
      }
    } else if (x > width - clickThreshold) {
      if (readingDirection === 'ltr') {
        nextPage();
      } else {
        prevPage();
      }
    }
  }, [nextPage, prevPage, readingDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const startTimer = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setShowControls(true);
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        hideTimerRef.current = null;
      }, 3000);
    };

    const handleActivity = () => startTimer();

    startTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [scrollMode]);

  const progress = useMemo(() => ({
    current: currentPage + 1,
    total: pages.length,
    percentage: Math.round(((currentPage + 1) / pages.length) * 100),
  }), [currentPage, pages.length]);

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
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-b border-[var(--text-inverse)]/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : '-translate-y-full'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
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
                Capítulo {chapterNumber}
                {scrollMode === 'continuous' && (
                  <span className="ml-2 text-[var(--info)] text-xs">· Continuo</span>
                )}
                {continuousReading && nextChapter && (
                  <span className="ml-2 text-[var(--success)] text-xs">· Auto-siguiente</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ControlButton onClick={zoomOut} title="Alejar (-)" aria-label="Alejar">
              <ZoomOut className="w-5 h-5" />
            </ControlButton>
            <span className="text-[var(--text-secondary)] text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <ControlButton onClick={zoomIn} title="Acercar (+)" aria-label="Acercar">
              <ZoomIn className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={resetZoom} title="Reset zoom (0)" aria-label="Restablecer zoom">
              <RotateCcw className="w-5 h-5" />
            </ControlButton>
            <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
            <ControlButton onClick={() => setScrollMode(m => m === 'single' ? 'continuous' : 'single')} title="Modo desplazamiento (C)" aria-label="Modo desplazamiento">
              <BookOpen className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={() => setViewMode(v => v === 'single' ? 'double' : 'single')} title="Modo de vista (W)" aria-label="Modo de vista">
              {viewMode === 'single' ? <Columns className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
            </ControlButton>
            <ControlButton
              onClick={() => setContinuousReading(v => !v)}
              disabled={!nextChapter}
              title={nextChapter ? `Lectura continua (I): ${continuousReading ? 'Activada' : 'Desactivada'}` : 'No hay siguiente capítulo'}
              aria-label={continuousReading ? 'Desactivar lectura continua' : 'Activar lectura continua'}
            >
              <Infinity className={cn('w-5 h-5', continuousReading && 'text-[var(--success)]')} />
            </ControlButton>
            <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
            <ControlButton onClick={() => setShowQuiz(true)} title="Pop Quiz" aria-label="Pop Quiz">
              <HelpCircle className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={() => setShowEditor(true)} title="Modo Edición" aria-label="Modo Edición">
              <MousePointerClick className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={() => setShowSponsor(true)} title="Patrocinar" aria-label="Patrocinar">
              <Crown className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={() => setShowMeme(true)} title="Generar Meme" aria-label="Generar Meme">
              <Type className="w-5 h-5" />
            </ControlButton>
            <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
            <ControlButton onClick={toggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa (F)'} aria-label="Pantalla completa">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </ControlButton>
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

      <main
        className="pt-14 pb-20 min-h-screen"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {scrollMode === 'continuous' ? (
          <div className="flex flex-col items-center gap-8 py-4">
            {pages.map((page, index) => (
              <motion.div
                key={`continuous-${index}`}
                ref={index === pages.length - 1 ? lastPageRef : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                className="w-full flex justify-center"
              >
                <div className="relative max-w-full cursor-pointer select-none" style={{ aspectRatio: '2/3' }}>
                  <OptimizedImage
                    src={page}
                    alt={`Página ${index + 1}`}
                    fill
                    objectFit="contain"
                    onClick={handleImageClick}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="relative max-w-full min-h-screen flex items-center justify-center"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {viewMode === 'double' ? (
              (() => {
                const leftPageIndex = currentPage % 2 === 0 ? currentPage : currentPage - 1;
                const rightPageIndex = leftPageIndex + 1;

                return (
                  <div className="flex justify-center gap-0.5" style={{ minHeight: '90vh' }}>
                    {leftPageIndex >= 0 && leftPageIndex < pages.length && (
                      <div className="relative max-w-[48vw] max-h-screen" style={{ aspectRatio: '2/3', display: isLoading ? 'none' : 'block' }}>
                        <OptimizedImage
                          src={pages[leftPageIndex]}
                          alt={`Página ${leftPageIndex + 1}`}
                          fill
                          objectFit="contain"
                          className="cursor-pointer select-none"
                          onClick={handleImageClick}
                        />
                      </div>
                    )}
                    {rightPageIndex < pages.length && (
                      <div className="relative max-w-[48vw] max-h-screen" style={{ aspectRatio: '2/3', display: isLoading ? 'none' : 'block' }}>
                        <OptimizedImage
                          src={pages[rightPageIndex]}
                          alt={`Página ${rightPageIndex + 1}`}
                          fill
                          objectFit="contain"
                          className="cursor-pointer select-none"
                          onClick={handleImageClick}
                        />
                      </div>
                    )}
                    {isLoading && (
                      <div role="status" aria-label="Cargando páginas" className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[var(--text-inverse)]/20 border-t-[var(--text-inverse)] rounded-full animate-spin" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: readingDirection === 'ltr' ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: readingDirection === 'ltr' ? -50 : 50 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="relative max-w-full max-h-screen cursor-pointer select-none" style={{ aspectRatio: '2/3', display: isLoading ? 'none' : 'block' }}>
                    <OptimizedImage
                      src={pages[currentPage]}
                      alt={`Página ${currentPage + 1}`}
                      fill
                      objectFit="contain"
                      onClick={handleImageClick}
                      onLoad={() => setIsLoading(false)}
                    />
                  </div>
                  {isLoading && (
                    <div role="status" aria-label="Cargando página" className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[var(--text-inverse)]/20 border-t-[var(--text-inverse)] rounded-full animate-spin" aria-hidden="true" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            <button
              aria-label="Página anterior"
              tabIndex={0}
              className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize opacity-0 hover:opacity-10 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => readingDirection === 'ltr' ? prevPage() : nextPage()}
            />
            <button
              aria-label="Página siguiente"
              tabIndex={0}
              className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize opacity-0 hover:opacity-10 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => readingDirection === 'ltr' ? nextPage() : prevPage()}
            />
          </div>
        )}
      </main>

      <footer
        role="contentinfo"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-t border-[var(--text-inverse)]/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="mb-3">
            <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de lectura: ${progress.percentage}%`}
              className="h-1 bg-[var(--text-inverse)]/10 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={zoomOut} aria-label="Alejar">
                <ZoomOut className="w-4 h-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-[var(--text-secondary)] min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="sm" onClick={zoomIn} aria-label="Acercar">
                <ZoomIn className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetZoom} aria-label="Restablecer zoom">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {prevChapter && (
                <Link href={`/manga/${mangaSlug}/${prevChapter.chapterNumber}`}>
                  <Button variant="ghost" size="sm" aria-label="Capítulo anterior">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <ControlButton
                onClick={prevPage}
                disabled={currentPage === 0}
                title="Página anterior (←)"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </ControlButton>
              <PageJumpInput
                currentPage={currentPage + 1}
                totalPages={pages.length}
                onJump={(page) => {
                  setCurrentPage(page - 1);
                  setIsLoading(true);
                  scrollToTop();
                }}
              />
              <ControlButton
                onClick={nextPage}
                disabled={currentPage === pages.length - 1 && !nextChapter}
                title="Página siguiente (→)"
                aria-label="Página siguiente"
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

      {showSettings && (
        <FocusLock>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-sunken)]/80"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reader-settings-title"
              className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="reader-settings-title" className="text-lg font-semibold text-[var(--text-primary)]">Ajustes de lectura</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} aria-label="Cerrar ajustes">
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-6">
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
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
                    <LayoutList className="w-4 h-4 mr-1" /> Página simple
                  </Button>
                  <Button
                    variant={viewMode === 'double' ? 'default' : 'outline'}
                    onClick={() => setViewMode('double')}
                    className="flex-1"
                  >
                    <Columns className="w-4 h-4 mr-1" /> Doble página
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Modo de desplazamiento
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={scrollMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setScrollMode('single')}
                    className="flex-1"
                  >
                    <LayoutList className="w-4 h-4 mr-1" /> Página por página
                  </Button>
                  <Button
                    variant={scrollMode === 'continuous' ? 'default' : 'outline'}
                    onClick={() => setScrollMode('continuous')}
                    className="flex-1"
                  >
                    <BookOpen className="w-4 h-4 mr-1" /> Desplazamiento continuo
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                  Lectura continua
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={continuousReading ? 'default' : 'outline'}
                    onClick={() => setContinuousReading(true)}
                    disabled={!nextChapter}
                    className="flex-1"
                    title={!nextChapter ? 'No hay siguiente capítulo disponible' : undefined}
                  >
                    <Infinity className="w-4 h-4 mr-1" /> Auto-siguiente
                  </Button>
                  <Button
                    variant={!continuousReading ? 'default' : 'outline'}
                    onClick={() => setContinuousReading(false)}
                    className="flex-1"
                  >
                    Manual
                  </Button>
                </div>
                {continuousReading && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Al llegar al final del capítulo, avanzarás automáticamente al siguiente.
                    {scrollMode === 'continuous' && ' En modo desplazamiento, la transición ocurre al hacer scroll hasta la última página.'}
                  </p>
                )}
                {!nextChapter && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Este es el último capítulo disponible.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-[var(--text-secondary)]">Capítulos disponibles: {totalChapters}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </FocusLock>
      )}

      {showHelp && (
        <FocusLock>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-sunken)]/80">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-help-title"
            className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="reader-help-title" className="text-lg font-semibold text-[var(--text-primary)]">Atajos de teclado</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)} aria-label="Cerrar ayuda">
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">← / →</span>
                <span className="text-[var(--text-primary)]">Página anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">A / D</span>
                <span className="text-[var(--text-primary)]">Página anterior / siguiente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">+ / -</span>
                <span className="text-[var(--text-primary)]">Zoom in / out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">↑ / ↓</span>
                <span className="text-[var(--text-primary)]">Zoom in / out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">0</span>
                <span className="text-[var(--text-primary)]">Reset zoom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">F</span>
                <span className="text-[var(--text-primary)]">Pantalla completa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">C</span>
                <span className="text-[var(--text-primary)]">Alternar desplazamiento continuo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">W</span>
                <span className="text-[var(--text-primary)]">Cambiar modo de vista</span>
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
                <span className="text-[var(--text-secondary)]">I</span>
                <span className="text-[var(--text-primary)]">Lectura continua (auto-siguiente capítulo)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Esc</span>
                <span className="text-[var(--text-primary)]">Cerrar modales / Salir de pantalla completa</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-secondary)]">
                También puedes hacer clic en los lados de la imagen para navegar o usar gestos táctiles (doble toque para zoom).
              </p>
            </div>
          </div>
        </div>
      </FocusLock>
      )}

      <QuizPopup
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        chapterTitle={`${mangaTitle} - Capítulo ${chapterNumber}`}
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
        chapterTitle={`${mangaTitle} - Capítulo ${chapterNumber}`}
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
