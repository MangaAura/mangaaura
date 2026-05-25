/**
 * useReadingMongoAnalytics Hook
 *
 * Hook especializado para tracking de analytics de lectura usando MongoDB.
 * Integración con ReadingAnalyticsService para guardar eventos detallados.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { extractApiError } from '@/lib/extract-api-error';

interface ReadingAnalyticsOptions {
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  totalPages: number;
}

interface ReadingStats {
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  avgReadingSpeed: number;
  mostViewedPages: Array<{ page: number; views: number }>;
  dailyStats: Array<{ date: string; reads: number; completions: number }>;
}

// Helper para enviar eventos de lectura a MongoDB
async function sendReadingEvent(
  chapterId: string,
  mangaId: string,
  eventType: 'scroll' | 'page_view' | 'completion',
  data?: { pageNumber?: number; scrollDepth?: number; duration?: number }
) {
  try {
    const response = await fetch('/api/analytics/reading', {
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

    if (!response.ok) {
      const { message } = await extractApiError(response);
      console.warn('Failed to send reading event:', message);
    }
  } catch (error) {
    // Silently fail - don't block UX
    console.warn('Error sending reading event:', error);
  }
}

export function useReadingMongoAnalytics({
  mangaId,
  chapterId,
  chapterNumber: _chapterNumber,
  totalPages,
}: ReadingAnalyticsOptions) {
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const pagesViewedRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);
  const lastPageRef = useRef<number>(0);
  const lastScrollEventRef = useRef<number>(0);
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { handleError } = useErrorHandler();

  // Use state for values needed during render (refs rule)
  const [pagesViewedCount, setPagesViewedCount] = useState(0);
  const [hasCompletedState, setHasCompletedState] = useState(false);

  // Track page view
  const trackPageView = useCallback((pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;

    // Agregar a páginas vistas
    pagesViewedRef.current.add(pageNumber);
    lastPageRef.current = pageNumber;
    setPagesViewedCount(pagesViewedRef.current.size);

    // Enviar evento a MongoDB
    sendReadingEvent(chapterId, mangaId, 'page_view', {
      pageNumber,
      duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
    });
  }, [chapterId, mangaId, totalPages]);

  // Track scroll event (throttled)
  const trackScroll = useCallback((scrollDepth: number) => {
    const now = Date.now();
    // Throttle: solo enviar cada 5 segundos
    if (now - lastScrollEventRef.current < 5000) return;
    lastScrollEventRef.current = now;

    // Calcular página estimada basada en profundidad
    const estimatedPage = Math.max(1, Math.min(
      totalPages,
      Math.floor((scrollDepth / 100) * totalPages)
    ));

    sendReadingEvent(chapterId, mangaId, 'scroll', {
      pageNumber: estimatedPage,
      scrollDepth,
    });
  }, [chapterId, mangaId, totalPages]);

  // Track completion
  const trackCompletion = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setHasCompletedState(true);

    const timeSpent = Date.now() - startTimeRef.current;
    const pagesViewed = pagesViewedRef.current.size;

    sendReadingEvent(chapterId, mangaId, 'completion', {
      pageNumber: totalPages,
      duration: Math.floor(timeSpent / 1000),
    });

    return {
      timeSpent,
      pagesViewed,
      percentageRead: totalPages > 0 ? (pagesViewed / totalPages) * 100 : 0,
    };
  }, [chapterId, mangaId, totalPages]);

  // Fetch reading stats para el capítulo
  const fetchReadingStats = useCallback(async () => {
    if (!chapterId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/reading/${chapterId}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      const data = await response.json();
      setReadingStats(data.stats);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, handleError]);

  // Initialize start time and auto-start tracking después de 3 segundos
  useEffect(() => {
    startTimeRef.current = Date.now();
    const timer = setTimeout(() => {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        trackPageView(1); // Empezar en la primera página
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [trackPageView]);

  // Enviar evento de time_spent al desmontar
  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTimeRef.current;

      if (hasStartedRef.current && !hasCompletedRef.current) {
        // Enviar datos de tiempo pasado
        sendReadingEvent(chapterId, mangaId, 'page_view', {
          pageNumber: lastPageRef.current || 1,
          duration: Math.floor(timeSpent / 1000),
        });
      }
    };
  }, [chapterId, mangaId]);

  return {
    trackPageView,
    trackScroll,
    trackCompletion,
    fetchReadingStats,
    readingStats,
    isLoading,
    pagesViewed: pagesViewedCount,
    hasCompleted: hasCompletedState,
  };
}

export default useReadingMongoAnalytics;