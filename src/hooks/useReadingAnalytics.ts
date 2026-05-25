/**
 * useReadingAnalytics Hook
 *
 * Hook especializado para tracking de analytics durante la lectura.
 * Incluye: inicio de lectura, cambios de página, y completado.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

import { trackEvent } from './useAnalytics';

interface ReadingAnalyticsOptions {
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  totalPages: number;
}

export function useReadingAnalytics({
  mangaId,
  chapterId,
  chapterNumber,
  totalPages,
}: ReadingAnalyticsOptions) {
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const pagesViewedRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);
  const lastPageRef = useRef<number>(0);

  // Use state for values needed during render (purity rule)
  const [pagesViewedCount, setPagesViewedCount] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Track start reading
  const trackStartReading = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    trackEvent({
      type: 'chapter_read',
      mangaId,
      chapterId,
      metadata: {
        chapterNumber,
        totalPages,
        timestamp: new Date().toISOString(),
      },
    });
  }, [mangaId, chapterId, chapterNumber, totalPages]);

  // Track page turn
  const trackPageTurn = useCallback((pageNumber: number) => {
    // Track that this page was viewed
    pagesViewedRef.current.add(pageNumber);
    lastPageRef.current = pageNumber;
    setPagesViewedCount(pagesViewedRef.current.size);

    trackEvent({
      type: 'page_view',
      mangaId,
      chapterId,
      metadata: {
        chapterNumber,
        pageNumber,
        totalPages,
        pagesViewed: pagesViewedRef.current.size,
      },
    });
  }, [mangaId, chapterId, chapterNumber, totalPages]);

  // Track completion
  const trackCompletion = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setHasCompleted(true);

    const timeSpent = Date.now() - startTimeRef.current;
    const percentageRead = (pagesViewedRef.current.size / totalPages) * 100;

    trackEvent({
      type: 'chapter_complete',
      mangaId,
      chapterId,
      metadata: {
        chapterNumber,
        totalPages,
        pagesViewed: pagesViewedRef.current.size,
        percentageRead,
        timeSpent,
        timeSpentSeconds: Math.round(timeSpent / 1000),
      },
    });
  }, [mangaId, chapterId, chapterNumber, totalPages]);

  // Track time spent on unmount
  useEffect(() => {
    const startTime = startTimeRef.current;
    return () => {
      const timeSpent = Date.now() - startTime;
      const pagesViewed = pagesViewedRef.current.size;

      if (hasStartedRef.current) {
        trackEvent({
          type: 'time_spent',
          mangaId,
          chapterId,
          metadata: {
            chapterNumber,
            timeSpent,
            timeSpentSeconds: Math.round(timeSpent / 1000),
            pagesViewed,
            percentageRead: totalPages > 0 ? (pagesViewed / totalPages) * 100 : 0,
            completed: hasCompletedRef.current,
          },
        });
      }
    };
  }, [mangaId, chapterId, chapterNumber, totalPages]);

  // Auto-start tracking after 3 seconds of being on page
  useEffect(() => {
    startTimeRef.current = Date.now();
    const timer = setTimeout(() => {
      trackStartReading();
    }, 3000);

    return () => clearTimeout(timer);
  }, [trackStartReading]);

  return {
    trackStartReading,
    trackPageTurn,
    trackCompletion,
    pagesViewed: pagesViewedCount,
    hasCompleted: hasCompleted,
  };
}

export default useReadingAnalytics;
