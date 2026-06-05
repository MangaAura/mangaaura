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
  Play,
  Pause,
  MessageSquare,
  Sun,
  Moon,
  ArrowUp,
  ArrowDown,
  Columns2,
  Columns3,
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
import { StarRating } from '@/components/ui/StarRating';
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

  // ReaderContent integration props
  showComments?: boolean;
  onToggleComments?: () => void;
  commentCount?: number;
  chapterRating?: number | null;
  onChapterRate?: (rating: number) => void;
  isDarkMode?: boolean;
  onThemeChange?: (isDark: boolean) => void;
  onPageChange?: (page: number) => void;
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

  // ReaderContent integration
  showComments,
  onToggleComments,
  commentCount = 0,
  chapterRating,
  onChapterRate,
  isDarkMode,
  onThemeChange,
  onPageChange,
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
  const [continuousLayout, setContinuousLayout] = useState<'single' | 'double'>(() => {
    if (typeof window === 'undefined') return 'single';
    try { return (localStorage.getItem('mangaaura-continuous-layout') as 'single' | 'double') || 'single'; } catch { return 'single'; }
  });
  const [continuousReading, setContinuousReading] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('mangaaura-continuous-reading') === 'true'; } catch { return false; }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOLED, setIsOLED] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('mangaaura-oled-mode') === 'true'; } catch { return false; }
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  const [showMeme, setShowMeme] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(5000);
  const [visiblePage, setVisiblePage] = useState(initialPage);
  const [showFloatingIndicator, setShowFloatingIndicator] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const preloadedPages = useRef<Set<number>>(new Set());
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);
  const continuousNavPending = useRef(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevPageRef = useRef(currentPage);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  useAutoSaveProgress(mangaId, chapterId, currentPage, pages.length);

  // Notify parent of page changes
  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      prevPageRef.current = currentPage;
      onPageChange?.(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Persist continuous reading preference
  useEffect(() => {
    try { localStorage.setItem('mangaaura-continuous-reading', String(continuousReading)); } catch { /* noop */ }
  }, [continuousReading]);

  // Persist OLED preference
  useEffect(() => {
    try { localStorage.setItem('mangaaura-oled-mode', String(isOLED)); } catch { /* noop */ }
  }, [isOLED]);

  // Persist continuous layout preference
  useEffect(() => {
    try { localStorage.setItem('mangaaura-continuous-layout', continuousLayout); } catch { /* noop */ }
  }, [continuousLayout]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
          autoAdvanceTimer.current = setTimeout(() => {
            if (continuousReading && nextChapter && !continuousNavPending.current) {
              continuousNavPending.current = true;
              navigateToChapter(nextChapter.chapterNumber);
            }
          }, 800);
        } else {
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

  // IntersectionObserver for tracking visible page in continuous mode
  useEffect(() => {
    if (scrollMode !== 'continuous') return;

    const pageElements = pageRefs.current;
    const visiblePages = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-page-index'));
          if (entry.isIntersecting) {
            visiblePages.set(index, entry.intersectionRatio);
          } else {
            visiblePages.delete(index);
          }
        });

        // Find the page with the highest intersection ratio
        let bestPage = -1;
        let bestRatio = 0;
        visiblePages.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = idx;
          }
        });

        if (bestPage >= 0) {
          setVisiblePage(bestPage);
          // Sync currentPage with the visible page so auto-scroll,
          // image-click navigation, and progress saving use the correct page
          setCurrentPage(bestPage);
          setShowFloatingIndicator(true);
          if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
          indicatorTimerRef.current = setTimeout(() => {
            setShowFloatingIndicator(false);
          }, 2000);
        }
      },
      { threshold: [0.1, 0.3, 0.5, 0.8] }
    );

    pageElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, [scrollMode, pages.length]);

  // Scroll tracking for floating indicator
  useEffect(() => {
    if (scrollMode !== 'continuous') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);

      setShowFloatingIndicator(true);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
      indicatorTimerRef.current = setTimeout(() => {
        setShowFloatingIndicator(false);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, [scrollMode]);

  // Auto-scroll effect for slideshow mode
  useEffect(() => {
    if (!autoScrollEnabled || scrollMode !== 'continuous') {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = undefined;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      const next = currentPageRef.current + 1;
      if (next < pages.length) {
        const el = pageRefs.current[next] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(next);
      } else {
        setAutoScrollEnabled(false);
      }
    }, autoScrollSpeed);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = undefined;
      }
    };
  }, [autoScrollEnabled, autoScrollSpeed, pages.length, scrollMode]);

  const nextPage = useCallback(() => {
    const step = viewMode === 'double' ? 2 : 1;
    const isLastPage = currentPage >= pages.length - step;

    if (isLastPage && continuousReading && nextChapter && !continuousNavPending.current) {
      continuousNavPending.current = true;
      navigateToChapter(nextChapter.chapterNumber);
      return;
    }

    if (scrollMode === 'continuous') {
      const next = currentPage + 1;
      if (next < pages.length) {
        const el = pageRefs.current[next] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(next);
        setVisiblePage(next);
      } else if (nextChapter && !continuousReading) {
        window.location.href = `/manga/${mangaSlug}/${nextChapter.chapterNumber}`;
      }
    } else if (currentPage < pages.length - step) {
      setCurrentPage(p => p + step);
      setVisiblePage(currentPage + step);
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
        const el = pageRefs.current[prev] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(prev);
        setVisiblePage(prev);
      } else if (prevChapter) {
        window.location.href = `/manga/${mangaSlug}/${prevChapter.chapterNumber}`;
      }
    } else if (currentPage >= step) {
      setCurrentPage(p => p - step);
      setVisiblePage(currentPage - step);
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

  const toggleTheme = useCallback(() => {
    onThemeChange?.(!isDarkMode);
  }, [onThemeChange, isDarkMode]);

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
      case 'p':
      case 'P':
        e.preventDefault();
        setAutoScrollEnabled(v => !v);
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        onToggleComments?.();
        break;
      case 'q':
      case 'Q':
        e.preventDefault();
        setContinuousLayout(l => l === 'single' ? 'double' : 'single');
        break;
    }
  }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom, toggleControls, toggleFullscreen, readingDirection, onToggleComments, setContinuousLayout]);

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
    <div className={cn('min-h-screen', isOLED ? 'bg-[#000]' : 'bg-[var(--surface-sunken)]')} ref={containerRef}>
      {/* Floating page indicator for continuous mode */}
      {scrollMode === 'continuous' && showFloatingIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)]/50 rounded-full px-4 py-1.5 shadow-lg"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Página {visiblePage + 1} / {pages.length}
          </span>
        </motion.div>
      )}

      {/* Top reading progress bar */}
      {scrollMode === 'continuous' && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-[var(--text-inverse)]/10">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--info)] transition-all duration-300"
            style={{ width: `${((visiblePage + 1) / pages.length) * 100}%` }}
          />
        </div>
      )}

      <header
        className={cn(
          isOLED ? 'fixed top-0 left-0 right-0 z-50 bg-[#000]/90 backdrop-blur-sm border-b border-white/10' : 'fixed top-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-b border-[var(--text-inverse)]/10',
          'transition-transform duration-300',
          scrollMode === 'continuous' ? 'top-0.5' : '',
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
              <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
                Capítulo {chapterNumber}
                {scrollMode === 'continuous' && (
                  <span className="text-[var(--info)] text-xs">· {continuousLayout === 'double' ? '2 columnas' : 'Continuo'}</span>
                )}
                {continuousReading && nextChapter && (
                  <span className="text-[var(--success)] text-xs">· Auto-siguiente</span>
                )}
                {onChapterRate && chapterRating !== undefined && (
                  <span className="inline-flex items-center">
                    <span className="text-[var(--text-muted)] text-xs mx-1">·</span>
                    <StarRating
                      value={chapterRating ?? 0}
                      interactive={true}
                      size="sm"
                      userRating={chapterRating || undefined}
                      onChange={onChapterRate}
                    />
                  </span>
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
            {/* In continuous mode: toggle single/double column layout */}
            {scrollMode === 'continuous' ? (
              <ControlButton onClick={() => setContinuousLayout(l => l === 'single' ? 'double' : 'single')} title="Columnas (Q)" aria-label="Distribución de columnas">
                {continuousLayout === 'double' ? <LayoutList className="w-5 h-5" /> : <Columns2 className="w-5 h-5" />}
              </ControlButton>
            ) : (
              <ControlButton onClick={() => setViewMode(v => v === 'single' ? 'double' : 'single')} title="Modo de vista (W)" aria-label="Modo de vista">
                {viewMode === 'single' ? <Columns className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
              </ControlButton>
            )}
            <ControlButton
              onClick={() => setContinuousReading(v => !v)}
              disabled={!nextChapter}
              title={nextChapter ? `Lectura continua (I): ${continuousReading ? 'Activada' : 'Desactivada'}` : 'No hay siguiente capítulo'}
              aria-label={continuousReading ? 'Desactivar lectura continua' : 'Activar lectura continua'}
            >
              <Infinity className={cn('w-5 h-5', continuousReading && 'text-[var(--success)]')} />
            </ControlButton>
            <div className="w-px h-6 bg-[var(--text-inverse)]/10 mx-2" />
            <ControlButton
              onClick={() => setAutoScrollEnabled(v => !v)}
              disabled={scrollMode !== 'continuous'}
              title={scrollMode !== 'continuous' ? 'Cambia a modo continuo para auto-scroll' : `Auto-scroll (P): ${autoScrollEnabled ? `${(autoScrollSpeed / 1000).toFixed(1)}s` : 'Desactivado'}`}
              aria-label={autoScrollEnabled ? 'Desactivar auto-scroll' : 'Activar auto-scroll'}
            >
              {autoScrollEnabled ? <Pause className="w-5 h-5 text-[var(--success)]" /> : <Play className="w-5 h-5" />}
            </ControlButton>

            {/* Comments button – shown when integrated with ReaderContent */}
            {onToggleComments && (
              <>
                <ControlButton
                  onClick={onToggleComments}
                  title={`Comentarios (M): ${showComments ? 'Abierto' : 'Cerrado'}`}
                  aria-label="Comentarios"
                >
                  <MessageSquare
                    className={cn('w-5 h-5', showComments && 'text-[var(--info)]')}
                  />
                </ControlButton>
                {commentCount > 0 && (
                  <span className="text-xs text-[var(--text-tertiary)] -ml-1.5">{commentCount}</span>
                )}
              </>
            )}

            {/* Theme toggle – shown when integrated with ReaderContent */}
            {onThemeChange && (
              <ControlButton onClick={toggleTheme} title={isDarkMode ? 'Tema claro' : 'Tema oscuro'} aria-label="Cambiar tema">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </ControlButton>
            )}

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
        className={cn(
          'min-h-screen',
          scrollMode === 'continuous' ? 'pt-16 pb-24' : 'pt-14 pb-20'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {scrollMode === 'continuous' ? (
          <div className="flex flex-col items-center">
            {continuousLayout === 'double' ? (
              /* ── 2-column layout (desktop) ── */
              (() => {
                const pairs: number[][] = [];
                for (let i = 0; i < pages.length; i += 2) {
                  pairs.push([i, i + 1 < pages.length ? i + 1 : -1]);
                }
                return pairs.map((pair, pairIdx) => (
                  <React.Fragment key={`pair-${pairIdx}`}>
                    {pairIdx > 0 && (
                      <div className="w-full h-16 bg-gradient-to-b from-transparent via-[var(--primary)]/5 to-transparent" />
                    )}
                    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
                      <div className="flex flex-col lg:flex-row lg:gap-6 items-center lg:items-start">
                        {pair.map((pageIdx) => {
                          if (pageIdx < 0) return <div key="empty" className="hidden lg:block lg:flex-1" />;
                          return (
                            <div
                              key={`col-page-${pageIdx}`}
                              ref={el => {
                                pageRefs.current[pageIdx] = el;
                                if (pageIdx === pages.length - 1) {
                                  (lastPageRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                                }
                              }}
                              data-page-index={pageIdx}
                              className="w-full lg:w-1/2 max-w-lg lg:max-w-none"
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(pairIdx * 0.03, 0.3) }}
                                className="relative group"
                              >
                                <div
                                  className="relative w-full cursor-pointer select-none rounded-lg overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
                                  style={{ aspectRatio: '2/3' }}
                                >
                                  <OptimizedImage
                                    src={pages[pageIdx]}
                                    alt={`Página ${pageIdx + 1}`}
                                    fill
                                    objectFit="contain"
                                    onClick={handleImageClick}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    style={{
                                      transform: `scale(${zoom})`,
                                      transformOrigin: 'top center',
                                      transition: 'transform 0.15s ease-out',
                                    }}
                                  />
                                </div>
                                {/* Page number overlay on hover */}
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  {pageIdx + 1} / {pages.length}
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                ));
              })()
            ) : (
              /* ── 1-column layout (default) ── */
              pages.map((page, index) => (
                <React.Fragment key={`continuous-${index}`}>
                  {/* Gradient separator between pages */}
                  {index > 0 && (
                    <div className="w-full h-12 bg-gradient-to-b from-transparent via-[var(--primary)]/5 to-transparent" />
                  )}
                  <div
                    ref={el => {
                      pageRefs.current[index] = el;
                      if (index === pages.length - 1) {
                        (lastPageRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                      }
                    }}
                    data-page-index={index}
                    className="w-full max-w-5xl mx-auto px-4 sm:px-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                      className="relative group"
                    >
                      {/* Page image */}
                      <div
                        className="relative w-full cursor-pointer select-none rounded-lg overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
                        style={{ aspectRatio: '2/3', maxWidth: '100%' }}
                      >
                        <OptimizedImage
                          src={page}
                          alt={`Página ${index + 1}`}
                          fill
                          objectFit="contain"
                          onClick={handleImageClick}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 800px"
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.15s ease-out',
                          }}
                        />
                      </div>

                      {/* Page number overlay on hover */}
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {index + 1} / {pages.length}
                      </div>
                    </motion.div>
                  </div>
                </React.Fragment>
              ))
            )}

            {/* Bottom spacer with gradient for smooth end */}
            <div className="w-full h-24 bg-gradient-to-t from-[var(--primary)]/5 to-transparent" />

            {/* Scroll to top / bottom buttons */}
            <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-2">
              {isScrolled && (
                <button
                  onClick={scrollToTop}
                  className="p-2.5 bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)]/50 rounded-full shadow-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all cursor-pointer"
                  title="Ir al inicio"
                  aria-label="Ir al inicio"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={scrollToBottom}
                className="p-2.5 bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)]/50 rounded-full shadow-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all cursor-pointer"
                title="Ir al final"
                aria-label="Ir al final"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
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
          isOLED ? 'fixed bottom-0 left-0 right-0 z-50 bg-[#000]/90 backdrop-blur-sm border-t border-white/10' : 'fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-sunken)]/90 backdrop-blur-sm border-t border-[var(--text-inverse)]/10',
          'transition-transform duration-300',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="mb-3">
            <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
              <span>
                {scrollMode === 'continuous' ? visiblePage + 1 : progress.current} / {progress.total}
              </span>
              <span>{progress.percentage}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de lectura: ${progress.percentage}%`}
              aria-live="polite"
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
                disabled={scrollMode === 'continuous' ? currentPage === 0 && !prevChapter : currentPage === 0}
                title="Página anterior (←)"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </ControlButton>
              <PageJumpInput
                currentPage={scrollMode === 'continuous' ? visiblePage + 1 : currentPage + 1}
                totalPages={pages.length}
                onJump={(page) => {
                  if (scrollMode === 'continuous') {
                    const el = pageRefs.current[page - 1] as HTMLElement | undefined;
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setCurrentPage(page - 1);
                    setVisiblePage(page - 1);
                  } else {
                    setCurrentPage(page - 1);
                    setIsLoading(true);
                    scrollToTop();
                  }
                }}
              />
              <ControlButton
                onClick={nextPage}
                disabled={scrollMode === 'continuous' ? currentPage >= pages.length - 1 && !nextChapter : currentPage === pages.length - 1 && !nextChapter}
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
              className={cn('rounded-xl p-6 w-full max-w-md mx-4', isOLED ? 'bg-[#000] border border-white/10' : 'bg-[var(--surface)]')}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="reader-settings-title" className={cn('text-lg font-semibold', isOLED ? 'text-white' : 'text-[var(--text-primary)]')}>Ajustes de lectura</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} aria-label="Cerrar ajustes">
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-6">
              {/* OLED Mode Toggle */}
              <div>
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
                  Modo OLED
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={isOLED ? 'default' : 'outline'}
                    onClick={() => setIsOLED(true)}
                    className="flex-1"
                  >
                    <Moon className="w-4 h-4 mr-1" /> OLED negro puro
                  </Button>
                  <Button
                    variant={!isOLED ? 'default' : 'outline'}
                    onClick={() => setIsOLED(false)}
                    className="flex-1"
                  >
                    <Sun className="w-4 h-4 mr-1" /> Oscuro normal
                  </Button>
                </div>
                <p className={cn('text-xs mt-2', isOLED ? 'text-gray-500' : 'text-[var(--text-tertiary)]')}>
                  Fondo negro puro (#000) para pantallas OLED. Ahorra batería y mejora el contraste de las imágenes.
                </p>
              </div>

              <div>
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
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
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
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

              {/* Continuous mode column layout – only relevant in scroll mode */}
              <div>
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
                  Distribución (modo continuo)
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={continuousLayout === 'single' ? 'default' : 'outline'}
                    onClick={() => setContinuousLayout('single')}
                    disabled={scrollMode !== 'continuous'}
                    className="flex-1"
                  >
                    <LayoutList className="w-4 h-4 mr-1" /> 1 columna
                  </Button>
                  <Button
                    variant={continuousLayout === 'double' ? 'default' : 'outline'}
                    onClick={() => setContinuousLayout('double')}
                    disabled={scrollMode !== 'continuous'}
                    className="flex-1"
                  >
                    <Columns3 className="w-4 h-4 mr-1" /> 2 columnas
                  </Button>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  En modo continuo con 2 columnas, las páginas se muestran lado a lado en desktop para una experiencia similar a un manga impreso.
                </p>
              </div>

              <div>
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
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
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
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
                <label className={cn('text-sm mb-2 block', isOLED ? 'text-gray-400' : 'text-[var(--text-secondary)]')}>
                  Auto-scroll
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={autoScrollEnabled ? 'default' : 'outline'}
                    onClick={() => setAutoScrollEnabled(true)}
                    disabled={scrollMode !== 'continuous'}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-1" /> Activar
                  </Button>
                  <Button
                    variant={!autoScrollEnabled ? 'default' : 'outline'}
                    onClick={() => setAutoScrollEnabled(false)}
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4 mr-1" /> Desactivar
                  </Button>
                </div>
                {autoScrollEnabled && (
                  <div className="mt-3">
                    <label className="text-xs text-[var(--text-tertiary)] block mb-2">
                      Velocidad: {(autoScrollSpeed / 1000).toFixed(1)}s por página
                    </label>
                    <input
                      type="range"
                      min={1500}
                      max={15000}
                      step={500}
                      value={autoScrollSpeed}
                      onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                    <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                      <span>Rápido</span>
                      <span>Lento</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  El auto-scroll avanza automáticamente entre páginas en modo continuo.
                </p>
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
            aria-labelledby="reader-help-title"              className={cn('rounded-xl p-6 w-full max-w-md mx-4', isOLED ? 'bg-[#000] border border-white/10' : 'bg-[var(--surface)]')}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="reader-help-title" className={cn('text-lg font-semibold', isOLED ? 'text-white' : 'text-[var(--text-primary)]')}>Atajos de teclado</h2>
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
                <span className="text-[var(--text-secondary)]">Q</span>
                <span className="text-[var(--text-primary)]">1 / 2 columnas (modo continuo)</span>
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
                <span className="text-[var(--text-secondary)]">P</span>
                <span className="text-[var(--text-primary)]">Auto-scroll (slideshow automático)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">M</span>
                <span className="text-[var(--text-primary)]">Toggle comentarios</span>
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
