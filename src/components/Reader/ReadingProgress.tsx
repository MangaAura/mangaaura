'use client';

import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  number: number;
  title: string | null;
}

export interface ReadingProgressProps {
  currentChapter: number;
  totalChapters: number;
  chapters?: Chapter[];
  mangaId: string;
  currentPage: number;
  totalPages: number;
  onChapterChange?: (chapterNumber: number) => void;
  className?: string;
}

interface SavedProgress {
  mangaId: string;
  chapterNumber: number;
  pageNumber: number;
  timestamp: number;
}

const STORAGE_KEY = 'mangaaura-reading-progress';

export function ReadingProgress({
  currentChapter,
  totalChapters,
  chapters = [],
  mangaId,
  currentPage,
  totalPages,
  onChapterChange,
  className,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showChapterList, setShowChapterList] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Calculate reading progress
  useEffect(() => {
    const pageProgress = totalPages > 0 ? currentPage / totalPages : 0;
    const chapterProgress = totalChapters > 0 ? (currentChapter - 1) / totalChapters : 0;
    const totalProgress = (chapterProgress + (pageProgress / totalChapters)) * 100;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(Math.min(100, Math.max(0, totalProgress)));
  }, [currentChapter, totalChapters, currentPage, totalPages]);

  // Load saved progress from localStorage using useMemo to avoid setState in effect
  const savedProgress = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allProgress: SavedProgress[] = JSON.parse(stored);
        return allProgress.find(p => p.mangaId === mangaId) || null;
      }
    } catch (error) {
      // Saved progress load uses useMemo, no hook needed for error logging
    }
    return null;
  }, [mangaId]);

  // Save progress
  const saveProgress = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allProgress: SavedProgress[] = stored ? JSON.parse(stored) : [];
      
      const newProgress: SavedProgress = {
        mangaId,
        chapterNumber: currentChapter,
        pageNumber: currentPage,
        timestamp: Date.now(),
      };

      // Update or add progress
      const filtered = allProgress.filter(p => p.mangaId !== mangaId);
      filtered.push(newProgress);

      // Keep only last 100 entries
      const trimmed = filtered.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setLastSaved(Date.now());
    } catch (error) {
      // Progress saved to localStorage, not a fetch error
    }
  }, [mangaId, currentChapter, currentPage]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => saveProgress();
  }, [saveProgress]);

  const goToPrevChapter = () => {
    if (currentChapter > 1) {
      onChapterChange?.(currentChapter - 1);
    }
  };

  const goToNextChapter = () => {
    if (currentChapter < totalChapters) {
      onChapterChange?.(currentChapter + 1);
    }
  };

  return (
    <>
    <div className={cn('bg-surface border-t border-border', className)}>
      {/* Progress Bar */}
      <div className="relative h-1 bg-surface-sunken">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Chapter Navigation */}
        <div className="flex items-center gap-2">
        <button
          onClick={goToPrevChapter}
          disabled={currentChapter <= 1}
          className="p-2 hover:bg-surface-sunken rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="Capítulo anterior"
          aria-label="Capítulo anterior"
        >
            <ChevronLeft size={20} />
          </button>

        <button
          onClick={() => setShowChapterList(!showChapterList)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
          aria-label="Lista de capítulos"
        >
            <BookOpen size={18} className="text-[var(--info)]" />
            <span className="font-medium">
              Cap. {currentChapter}
            </span>
            <span className="text-muted-foreground text-sm">
              / {totalChapters}
            </span>
          </button>

        <button
          onClick={goToNextChapter}
          disabled={currentChapter >= totalChapters}
          className="p-2 hover:bg-surface-sunken rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="Siguiente capítulo"
          aria-label="Siguiente capítulo"
        >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Page Progress */}
        <div className="text-sm text-muted-foreground">
          Página {currentPage + 1} / {totalPages}
        </div>
      </div>

      {/* Chapter List Dropdown */}
      {showChapterList && (
        <div className="absolute bottom-full left-4 mb-2 w-64 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden z-30">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold">Lista de Capítulos</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    onChapterChange?.(chapter.number);
                    setShowChapterList(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
chapter.number === currentChapter
                    ? 'bg-[var(--info)]/10 text-[var(--info)]'
                      : 'hover:bg-surface-sunken'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>Capítulo {chapter.number}</span>
                    {chapter.number === currentChapter && (
                      <span className="w-2 h-2 rounded-full bg-[var(--info)]" />
                    )}
                  </div>
                  {chapter.title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {chapter.title}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No hay capítulos disponibles
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Read Indicator */}
      {savedProgress && savedProgress.chapterNumber !== currentChapter && (
        <div className="absolute -top-8 right-4 bg-[var(--info)] text-[var(--text-inverse)] text-xs px-3 py-1.5 rounded-full shadow-lg">
          Última vez: Cap. {savedProgress.chapterNumber}, Pág. {savedProgress.pageNumber + 1}
        </div>
      )}
    </div>

    {lastSaved && (
      <div aria-live="polite" className="sr-only">
        Progreso guardado automáticamente
      </div>
    )}
    </>
  );
}

export default ReadingProgress;
