/**
 * Chapter Reader Page
 * 
 * Página de lectura de capítulo con comentarios integrados.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { CommentSection } from '@/components/Comments/CommentSection';
import { useChapterComments } from '@/hooks/useChapterComments';
import { useChapterAnalytics, trackEvent } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Layout/Navbar';
import { OptimizedImage } from '@/components/Image';

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
  const { data: session } = useSession();
  const chapterId = params.slug as string;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { comments } = useChapterComments(chapterId);
  const { trackComment, trackLike } = useChapterAnalytics(chapterId, chapter?.manga.id ?? '');

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">{error || 'Error al cargar'}</p>
          <button 
            onClick={() => router.push('/browse')}
            className="mt-4 text-blue-400 hover:underline"
          >
            Volver a explorar
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentPage + 1) / chapter.totalPages) * 100;

  return (
    <div className={cn(
      'min-h-screen transition-colors',
      isDarkMode ? 'bg-slate-900' : 'bg-slate-100'
    )}>
      <Navbar />

      {/* Main Content */}
      <div className="pt-14">
        {/* Header Info */}
        <div className={cn(
          'border-b px-4 py-3 flex items-center justify-between',
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/manga/${chapter.manga.id}`)}
              className={cn(
                'flex items-center gap-2 text-sm hover:opacity-80',
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {chapter.manga.title}
            </button>
            <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>|</span>
            <span className={cn(
              'text-sm font-medium',
              isDarkMode ? 'text-white' : 'text-slate-900'
            )}>
              Cap. {chapter.chapterNumber}
              {chapter.title && `: ${chapter.title}`}
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className={cn(
              'text-sm font-mono min-w-[60px] text-center',
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            )}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                showComments 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'hover:bg-slate-700/50 text-slate-400'
              )}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === chapter.totalPages - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          <div className={cn(
            'fixed right-0 top-[112px] bottom-0 w-full lg:w-[400px] transform transition-transform duration-300 overflow-hidden z-40',
            showComments ? 'translate-x-0' : 'translate-x-full',
            isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'
          )}>
            {/* Comments Header */}
            <div className={cn(
              'flex items-center justify-between px-4 py-3 border-b',
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            )}>
              <h3 className={cn(
                'font-semibold flex items-center gap-2',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}>
                <MessageSquare className="w-5 h-5" />
                Comentarios
                <span className={cn(
                  'text-sm',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}>
                  ({comments.length})
                </span>
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments Content */}
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              <CommentSection 
                chapterId={chapterId}
                mangaId={chapter.manga.id}
                className={isDarkMode ? 'bg-slate-900' : 'bg-white'}
              />
            </div>
          </div>
        </div>

        {/* Page Indicator */}
        <div className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg',
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
        )}>
          {currentPage + 1} / {chapter.totalPages}
        </div>
      </div>
    </div>
  );
}
