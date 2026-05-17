'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/Image/OptimizedImage';

export interface PageViewerProps {
  pages: string[];
  currentPage?: number;
  viewMode: 'scroll' | 'paged';
  onPageChange?: (page: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onChapterEnd?: () => void;
  onOpenMeme?: (imageUrl: string) => void;
  onOpenEditor?: (imageUrl: string) => void;
  className?: string;
}

// Memoized scroll page item component
interface ScrollPageItemProps {
  page: string;
  index: number;
  totalPages: number;
  onOpenMeme?: (imageUrl: string) => void;
  onOpenEditor?: (imageUrl: string) => void;
  onLoad: () => void;
  onStartLoad: () => void;
  isLoading: boolean;
}

const ScrollPageItem = memo(function ScrollPageItem({
  page,
  index,
  totalPages,
  onOpenMeme,
  onOpenEditor,
  onLoad,
  onStartLoad,
  isLoading,
}: ScrollPageItemProps) {
  // Track when image starts loading
  useEffect(() => {
    onStartLoad();
  }, [onStartLoad]);

  return (
    <div className="relative group">
      {/* Loading State */}
      {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-sunken)]/50 rounded-lg z-10">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Page Image */}
      <div className="relative">
        <OptimizedImage
          src={page}
          alt={`Página ${index + 1}`}
          width={800}
          height={1200}
          loading={index < 3 ? 'eager' : 'lazy'}
          priority={index === 0}
          objectFit="contain"
          className="w-full h-auto rounded-lg shadow-lg bg-[var(--surface)]"
          onLoad={onLoad}
          fallbackOnError={true}
          sizes="(max-width: 768px) 100vw, 800px"
        />

        {/* Page Actions Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onOpenMeme && (
        <button
          onClick={() => onOpenMeme(page)}
          className="p-2 bg-black/70 hover:bg-[var(--accent-blue-hover)] text-[var(--text-inverse)] rounded-full shadow-lg transition-colors cursor-pointer"
          title="Crear Meme"
          aria-label="Crear meme"
        >
              <ImageIcon size={18} />
            </button>
          )}
          {onOpenEditor && (
        <button
          onClick={() => onOpenEditor(page)}
          className="p-2 bg-black/70 hover:bg-[var(--accent-purple-hover)] text-[var(--text-inverse)] rounded-full shadow-lg transition-colors cursor-pointer"
          title="Modo Editor"
          aria-label="Modo editor"
        >
              <ZoomIn size={18} />
            </button>
          )}
        </div>

        {/* Page Number */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-[var(--text-inverse)] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          {index + 1} / {totalPages}
        </div>
      </div>
    </div>
  );
});

// Memoized paged viewer component
const PagedViewer = memo(function PagedViewer({
  currentPage,
  pages,
  loadingPages,
  onLoad,
  onPrevPage,
  onNextPage,
}: {
  currentPage: number;
  pages: string[];
  loadingPages: Set<number>;
  onLoad: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Loading State */}
      {loadingPages.has(currentPage) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Page Image */}
      <OptimizedImage
        src={pages[currentPage]}
        alt={`Página ${currentPage + 1}`}
        fill
        priority={true}
        objectFit="contain"
        className="rounded-lg shadow-2xl"
        onLoad={onLoad}
        fallbackOnError={true}
        sizes="100vw"
      />

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        {/* Left Navigation Area */}
        <button
          onClick={onPrevPage}
          disabled={currentPage === 0}
          className="w-1/4 h-full flex items-center justify-start px-4 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0"
          aria-label="Página anterior"
        >
          <div className="bg-black/50 hover:bg-black/70 text-[var(--text-inverse)] p-2 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </div>
        </button>

        {/* Center (empty for image interaction) */}
        <div className="flex-1 h-full" />

        {/* Right Navigation Area */}
        <button
          onClick={onNextPage}
          className="w-1/4 h-full flex items-center justify-end px-4 opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Página siguiente"
        >
          <div className="bg-black/50 hover:bg-black/70 text-[var(--text-inverse)] p-2 rounded-full transition-colors">
            <ChevronRight size={24} />
          </div>
        </button>
      </div>

      {/* Page Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-[var(--text-inverse)] px-4 py-2 rounded-full text-sm">
        {currentPage + 1} / {pages.length}
      </div>
    </div>
  );
});

export const PageViewer = memo(function PageViewer({
  pages,
  currentPage: _currentPage,
  viewMode,
  onPageChange,
  onNext: _onNext,
  onPrev: _onPrev,
  onChapterEnd,
  onOpenMeme,
  onOpenEditor,
  className,
}: PageViewerProps) {
  const [currentPage, setCurrentPage] = useState(_currentPage ?? 0);
  const [zoom, setZoom] = useState(100);
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Navigation callbacks
  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, pages.length - 1));
    setCurrentPage(clamped);

    if (viewMode === 'paged' && pageRefs.current[clamped]) {
      pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [pages.length, viewMode]);

  const goToNextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    } else {
      onChapterEnd?.();
    }
  }, [currentPage, pages.length, goToPage, onChapterEnd]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Keyboard navigation - memoized
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (viewMode !== 'paged') return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        goToNextPage();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goToPrevPage();
        break;
      case 'Home':
        e.preventDefault();
        goToPage(0);
        break;
      case 'End':
        e.preventDefault();
        goToPage(pages.length - 1);
        break;
    }
  }, [viewMode, goToNextPage, goToPrevPage, goToPage, pages.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll progress tracking for scroll mode
  useEffect(() => {
    if (viewMode !== 'scroll' || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollPercent = container.scrollTop / (container.scrollHeight - container.clientHeight);
      const estimatedPage = Math.min(
        pages.length - 1,
        Math.floor(scrollPercent * pages.length)
      );
      setCurrentPage(estimatedPage);

      // Track completion
      if (scrollPercent >= 0.95) {
        onChapterEnd?.();
      }
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode, pages.length, onChapterEnd]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 25, 200)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 25, 50)), []);
  const handleZoomReset = useCallback(() => setZoom(100), []);

  // Image load handlers - memoized
  const handleImageLoad = useCallback((index: number) => {
    setLoadingPages(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setLoadedPages(prev => new Set(prev).add(index));
  }, []);

  const handleImageStartLoad = useCallback((index: number) => {
    setLoadingPages(prev => {
      if (!loadedPages.has(index) && !prev.has(index)) {
        return new Set(prev).add(index);
      }
      return prev;
    });
  }, [loadedPages]);

  return (
    <div className={cn('relative h-full w-full flex flex-col', className)}>
      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-auto bg-black/5 dark:bg-black/20',
          viewMode === 'paged' ? 'flex items-center justify-center' : ''
        )}
      >
        <div
          className={cn(
            'transition-transform duration-200 ease-out origin-center',
            viewMode === 'scroll' ? 'w-full max-w-4xl mx-auto py-4 px-4' : 'w-full h-full flex items-center justify-center px-4'
          )}
          style={{ transform: `scale(${zoom / 100})` }}
        >
      {viewMode === 'scroll' ? (
        // Scroll Mode with memoized components
        <div className="flex flex-col gap-4 pb-20">
          {pages.map((page, index) => (
            <div
              key={`page-${index}`}
              ref={el => { pageRefs.current[index] = el; }}
            >
              <ScrollPageItem
                page={page}
                index={index}
                totalPages={pages.length}
                onOpenMeme={onOpenMeme}
                onOpenEditor={onOpenEditor}
                onLoad={() => handleImageLoad(index)}
                onStartLoad={() => handleImageStartLoad(index)}
                isLoading={loadingPages.has(index)}
              />
            </div>
          ))}
        </div>
      ) : (
        // Paged Mode with memoized component
        <PagedViewer
          currentPage={currentPage}
          pages={pages}
          loadingPages={loadingPages}
          onLoad={() => handleImageLoad(currentPage)}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
        />
      )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-[var(--surface)]/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="p-2 text-[var(--text-inverse)] hover:bg-[var(--text-inverse)]/10 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
          title="Alejar"
          aria-label="Alejar"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 text-xs font-medium text-[var(--text-inverse)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer"
          title="Restablecer zoom"
          aria-label="Restablecer zoom"
        >
          {zoom}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="p-2 text-[var(--text-inverse)] hover:bg-[var(--text-inverse)]/10 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
          title="Acercar"
          aria-label="Acercar"
        >
          <ZoomIn size={18} />
        </button>
      </div>
    </div>
  );
});

export default PageViewer;
