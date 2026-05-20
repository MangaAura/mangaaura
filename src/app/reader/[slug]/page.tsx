/**
 * Chapter Reader Page
 * 
 * Página de lectura de capítulo con comentarios integrados.
 */

'use client';

import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  X,
  Maximize,
  Minimize,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { CommentSection } from '@/components/Comments/CommentSection';
import { OptimizedImage } from '@/components/Image';
import { useChapterAnalytics, trackEvent } from '@/hooks/useAnalytics';
import { useChapterComments } from '@/hooks/useChapterComments';
import { cn } from '@/lib/utils';


const Navbar = dynamic(() => import('@/components/Layout/Navbar'), { ssr: true });

interface Chapter {
  id: string;
  chapterNumber: number;
  title?: string;
  totalPages: number;
  pageUrls: string[];
  manga: {
    id: string;
    title: string;
    coverUrl?: string;
  };
}

export default function ChapterReaderPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.slug as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode] = useState(false);

  const { comments } = useChapterComments(chapterId);
  void useChapterAnalytics(chapterId, chapter?.manga.id ?? '');

  // Cargar capítulo
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await fetch(`/api/manga/chapters/${chapterId}`);
        if (!response.ok) throw new Error('Chapter not found');
        const data = await response.json();
        setChapter(data);
        
        // Track view
        trackEvent({
          type: 'page_view',
          mangaId: data.manga.id,
          chapterId: data.id,
        });
      } catch (err) {
        setError('Capítulo no encontrado');
      } finally {
        setIsLoading(false);
      }
    };

    if (chapterId) {
      fetchChapter();
    }
  }, [chapterId]);

  // Track reading progress
  useEffect(() => {
    if (!chapter) return;

    const timer = setTimeout(() => {
      trackEvent({
        type: 'chapter_read',
        mangaId: chapter.manga.id,
        chapterId: chapter.id,
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [chapter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'Escape') setShowComments(false);
      if (e.key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, chapter]);

  const nextPage = useCallback(() => {
    if (!chapter) return;
    if (currentPage < chapter.totalPages - 1) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, chapter]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        {/* Skeleton header */}
        <div className="h-14 bg-[var(--surface-sunken)] animate-pulse" />
        {/* Skeleton toolbar */}
        <div className="h-12 bg-[var(--surface-elevated)] border-b border-[var(--border)] animate-pulse" />
        {/* Skeleton reader area */}
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
          <div className="w-full max-w-3xl animate-pulse">
            <div className="aspect-[3/4] bg-[var(--surface-elevated)] rounded-xl" />
          </div>
        </div>
        {/* Skeleton page indicator */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <div className="w-24 h-8 rounded-full bg-[var(--surface-sunken)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">{error || 'Error al cargar'}</p>
        <button
          onClick={() => router.push('/search_ia')}
          className="mt-4 text-[var(--info)] hover:underline cursor-pointer"
        >
            Volver a explorar
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentPage + 1) / chapter.totalPages) * 100;

  return (
    <motion.div
      className={cn(
      'min-h-screen transition-colors',
      isDarkMode ? 'bg-[var(--surface)]' : 'bg-[var(--surface-elevated)]'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />

      {/* Main Content */}
      <div className="pt-14">
        {/* Header Info */}
        <div className={cn(
          'border-b px-4 py-3 flex items-center justify-between',
          isDarkMode ? 'bg-[var(--surface-sunken)] border-[var(--border)]' : 'bg-[var(--surface-elevated)] border-[var(--border)]'
        )}>
          <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/manga/${chapter.manga.id}`)}
          className={cn(
            'flex items-center gap-2 text-sm hover:opacity-80 cursor-pointer',
            isDarkMode ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
          )}
          aria-label="Volver al manga"
        >
              <ChevronLeft className="w-4 h-4" />
              {chapter.manga.title}
            </button>
            <span className={isDarkMode ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}>|</span>
            <span className={cn(
              'text-sm font-medium',
              isDarkMode ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
            )}>
              Cap. {chapter.chapterNumber}
              {chapter.title && `: ${chapter.title}`}
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] cursor-pointer"
          title="Zoom out"
          aria-label="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
            <span className={cn(
              'text-sm font-mono min-w-[60px] text-center',
              isDarkMode ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
            )}>
              {Math.round(zoom * 100)}%
            </span>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] cursor-pointer"
          title="Zoom in"
          aria-label="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.push('/search_ia')}
          className="mt-4 text-[var(--info)] hover:underline cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] cursor-pointer"
          title="Fullscreen"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer',
            showComments
            ? 'bg-[var(--primary)]/20 text-[var(--info)]'
            : 'hover:bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)]'
          )}
          aria-label={showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'}
        >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-[var(--surface-sunken)]">
          <div 
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reader */}
        <div className="flex">
          {/* Page Viewer */}
          <div className={cn(
            'flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] p-4',
            showComments && 'lg:mr-[400px]'
          )}>
            <div className="relative">
            {/* Page Image */}
            {chapter.pageUrls[currentPage] && (
              <div
                className="max-w-full max-h-[calc(100vh-180px)] overflow-hidden"
                style={{ transform: `scale(${zoom})` }}
              >
                <OptimizedImage
                  src={chapter.pageUrls[currentPage]}
                  alt={`Página ${currentPage + 1}`}
                  width={1200}
                  height={1800}
                  priority={true}
                  objectFit="contain"
                  className="max-w-full max-h-[calc(100vh-180px)] shadow-2xl"
                  fallbackOnError={true}
                />
              </div>
            )}

              {/* Page Navigation */}
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-[var(--text-inverse)] hover:bg-black/70 disabled:opacity-0 transition-all cursor-pointer"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === chapter.totalPages - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-[var(--text-inverse)] hover:bg-black/70 disabled:opacity-0 transition-all cursor-pointer"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          <div className={cn(
            'fixed right-0 top-[112px] bottom-0 w-full lg:w-[400px] transform transition-transform duration-300 overflow-hidden z-40',
            showComments ? 'translate-x-0' : 'translate-x-full',
            isDarkMode ? 'bg-[var(--surface)] border-l border-[var(--surface-sunken)]' : 'bg-[var(--surface-elevated)] border-l border-[var(--border)]'
          )}>
            {/* Comments Header */}
            <div className={cn(
              'flex items-center justify-between px-4 py-3 border-b',
              isDarkMode ? 'border-[var(--surface-sunken)]' : 'border-[var(--border)]'
            )}>
              <h3 className={cn(
                'font-semibold flex items-center gap-2',
    isDarkMode ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              )}>
                <MessageSquare className="w-5 h-5" />
                Comentarios
                <span className={cn(
                  'text-sm',
                  isDarkMode ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
                )}>
                  ({comments.length})
                </span>
              </h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] cursor-pointer"
                  aria-label="Cerrar comentarios"
                >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments Content */}
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              <CommentSection 
                chapterId={chapterId}
                mangaId={chapter.manga.id}
                className={    isDarkMode ? 'bg-[var(--surface)]' : 'bg-[var(--surface-elevated)]'}
              />
            </div>
          </div>
        </div>

        {/* Page Indicator */}
        <div className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg',
          isDarkMode ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' : 'bg-[var(--surface-elevated)] text-[var(--text-primary)]'
        )}>
          {currentPage + 1} / {chapter.totalPages}
        </div>
      </div>
    </motion.div>
  );
}
