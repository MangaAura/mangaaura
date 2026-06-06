/**
 * useReadingProgress Hook
 * 
 * Maneja el progreso de lectura del usuario.
 */

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { useThrottle } from '@/hooks/useDebounce';
import { extractApiError } from '@/lib/extract-api-error';
import { fetcher, getErrorMessage } from '@/lib/swr-config';

export interface ReadingProgress {
  id: string;
  mangaId: string;
  chapterId: string;
  page: number;
  percentage: number;
  updatedAt: string;
  manga?: {
    id: string;
    title: string;
    slug: string;
    coverUrl?: string;
  };
  chapter?: {
    id: string;
    chapterNumber: number;
    title?: string;
  };
}

interface ProgressData {
  progress: ReadingProgress[];
}

/**
 * Hook for user's reading progress
 */
export function useReadingProgress(mangaId?: string) {
  const { data: session } = useSession();
  // Only fetch progress if user is authenticated — prevents 401 console errors
  const key = session?.user
    ? (mangaId ? `/api/progress?mangaId=${mangaId}` : '/api/progress')
    : null;

  const { data, error, isLoading, mutate } = useSWR<ProgressData>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    progress: data?.progress || [],
    isLoading,
    error: error ? getErrorMessage(error) : null,
    mutate,
  };
}

/**
 * Hook for updating reading progress
 */
export function useUpdateReadingProgress() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/progress',
    async (url: string, { arg }: { arg: { mangaId: string; chapterId: string; currentPage: number; percentage: number } }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mangaId: arg.mangaId,
          chapterId: arg.chapterId,
          currentPage: arg.currentPage,
          percentage: arg.percentage,
        }),
      });
      
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      
      return response.json();
    }
  );

  return {
    updateProgress: trigger,
    isLoading: isMutating,
    error: error ? getErrorMessage(error) : null,
  };
}

/**
 * Hook for auto-saving reading progress
 */
export function useAutoSaveProgress(
  mangaId: string,
  chapterId: string,
  currentPage: number,
  totalPages: number
) {
  const { updateProgress, isLoading } = useUpdateReadingProgress();
  const lastSaved = useRef(0);

  const save = useCallback(async () => {
    if (!mangaId || !chapterId || currentPage === lastSaved.current) return;
    
    const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    
    try {
      await updateProgress({
        mangaId,
        chapterId,
        currentPage,
        percentage,
      });
      lastSaved.current = currentPage;
    } catch (error) {
      // Silently fail — progress save is non-critical, no need to bother the user
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Reader] Auto-save progress failed:', error);
      }
    }
  }, [mangaId, chapterId, currentPage, totalPages, updateProgress]);

  // Throttled save (every 5 seconds)
  const throttledSave = useThrottle(save, 5000);

  // Save on page change
  useEffect(() => {
    throttledSave();
  }, [currentPage, throttledSave]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (lastSaved.current !== currentPage) {
        save();
      }
    };
  }, [save, currentPage]);

  return { isSaving: isLoading, save };
}

export default useReadingProgress;
