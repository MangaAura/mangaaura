'use client';

import { Image as ImageIcon, MousePointerClick, Crown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { OptimizedImage } from '@/components/Image';

interface ReaderViewerProps {
  pages: string[];
  viewMode: 'scroll' | 'paged';
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  onChapterEnd?: () => void;
  onOpenMeme?: (imageUrl: string) => void;
  onOpenEditor?: (imageUrl: string) => void;
  onOpenSponsor?: () => void;
}

// Helper para enviar eventos de analytics
async function sendReadingEvent(
  chapterId: string,
  mangaId: string,
  eventType: 'scroll' | 'page_view' | 'completion',
  data?: { pageNumber?: number; scrollDepth?: number; duration?: number }
) {
  try {
    await fetch('/api/analytics/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        mangaId,
        event: {
          type: eventType,
          timestamp: new Date().toISOString(),
          data,
        },
      }),
      keepalive: true,
    });
  } catch {
    // Silently fail - no bloquear la UX
  }
}

export default function ReaderViewer({
  pages,
  viewMode,
  mangaId,
  chapterId,
  onChapterEnd,
  onOpenMeme,
  onOpenEditor,
  onOpenSponsor,
}: ReaderViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs para tracking de analytics
  const hasCompletedRef = useRef(false);
  const lastPageViewRef = useRef<number>(-1);
  const lastScrollEventRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Enviar evento page_view cada 30 segundos para la página actual
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewMode === 'paged') {
        sendReadingEvent(chapterId, mangaId, 'page_view', {
          pageNumber: currentPage + 1,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        });
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [chapterId, mangaId, currentPage, viewMode]);

  // Track cambio de página en modo paged
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);

    // Enviar evento page_view
    if (newPage !== lastPageViewRef.current) {
      lastPageViewRef.current = newPage;
      sendReadingEvent(chapterId, mangaId, 'page_view', {
        pageNumber: newPage + 1,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });
    }
  }, [chapterId, mangaId]);

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode === 'scroll' && containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        const estimatedPage = Math.min(
          pages.length - 1,
          Math.floor(scrollPercentage * pages.length)
        );
        setCurrentPage(estimatedPage);

        // Enviar evento de scroll (throttle: cada 5 segundos)
        const now = Date.now();
        if (now - lastScrollEventRef.current > 5000) {
          lastScrollEventRef.current = now;
          sendReadingEvent(chapterId, mangaId, 'scroll', {
            pageNumber: estimatedPage + 1,
            scrollDepth: Math.round(scrollPercentage * 100),
          });
        }

        // Si llegó al final del scroll, enviar completion
        if (scrollTop + clientHeight >= scrollHeight - 50 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          sendReadingEvent(chapterId, mangaId, 'completion', {
            pageNumber: pages.length,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
          });
          onChapterEnd?.();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [viewMode, pages.length, chapterId, mangaId, onChapterEnd]);

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      handlePageChange(currentPage + 1);
    } else {
      // Última página - enviar completion
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        sendReadingEvent(chapterId, mangaId, 'completion', {
          pageNumber: pages.length,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        });
      }
      onChapterEnd?.();
    }
  };

  const ActionButtons = ({ pageUrl }: { pageUrl: string }) => (
    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={(e) => { e.stopPropagation(); onOpenMeme?.(pageUrl); }}
      className="bg-black/70 hover:bg-accent-blue text-[var(--text-inverse)] p-2 rounded-full shadow-lg transition-colors cursor-pointer"
      title="Crear Meme"
      aria-label="Crear meme"
    >
        <ImageIcon size={18} />
      </button>
    <button
      onClick={(e) => { e.stopPropagation(); onOpenEditor?.(pageUrl); }}
      className="bg-black/70 hover:bg-accent-red text-[var(--text-inverse)] p-2 rounded-full shadow-lg transition-colors cursor-pointer"
      title="Reportar Error (Crowdsourcing)"
      aria-label="Reportar error"
    >
        <MousePointerClick size={18} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onOpenSponsor?.(); }}
      className="bg-black/70 hover:bg-[var(--warning)] text-[var(--text-inverse)] p-2 rounded-full shadow-lg transition-colors cursor-pointer"
      title="Patrocinar Próximo Capítulo"
      aria-label="Patrocinar capítulo"
    >
        <Crown size={18} />
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-y-auto overflow-x-hidden ${viewMode === 'paged' ? 'flex items-center justify-center' : ''}`}
    >
      <div className={`max-w-3xl mx-auto ${viewMode === 'paged' ? 'w-full px-4' : ''}`}>
        {viewMode === 'scroll' ? (
          <div className="flex flex-col space-y-2 pb-20">
            {pages.map((page, index) => (
              <div key={`reader-page-${index}`} className="w-full relative group">
            <OptimizedImage
              src={page}
              alt={`Página ${index + 1}`}
              width={800}
              height={1200}
              loading={index < 3 ? 'eager' : 'lazy'}
              priority={index === 0}
              objectFit="contain"
              className="w-full h-auto bg-secondary"
              fallbackOnError={true}
            />
                <ActionButtons pageUrl={page} />
                <div className="absolute bottom-2 right-2 bg-black/70 text-[var(--text-inverse)] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1} / {pages.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full aspect-[2/3] max-h-[80vh] flex justify-center group">
          <OptimizedImage
            src={pages[currentPage]}
            alt={`Página ${currentPage + 1}`}
            fill
            priority={true}
            objectFit="contain"
            className="max-w-full max-h-full shadow-lg"
            fallbackOnError={true}
          />
            <ActionButtons pageUrl={pages[currentPage]} />

            {/* Navigation Controls for Paged Mode */}
            <div className="absolute inset-0 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <button
          className="h-full w-1/4 flex items-center justify-start px-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-auto cursor-pointer"
          onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
          aria-label="Página anterior"
        >
                <span className="bg-black/50 text-[var(--text-inverse)] px-3 py-1 rounded">Anterior</span>
              </button>
        <button
          className="h-full w-1/4 flex items-center justify-end px-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-auto cursor-pointer"
          onClick={handleNextPage}
          aria-label="Página siguiente"
        >
                <span className="bg-black/50 text-[var(--text-inverse)] px-3 py-1 rounded">
                  {currentPage === pages.length - 1 ? 'Finalizar' : 'Siguiente'}
                </span>
              </button>
            </div>
            <div className="absolute bottom-[-30px] left-0 right-0 text-center text-sm text-muted">
              {currentPage + 1} / {pages.length}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar (Global) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-tertiary">
        <div
          className="h-full bg-accent-blue transition-all duration-300"
          style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
