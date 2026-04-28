/**
 * useAnalytics Hook
 * 
 * Hook para tracking y análisis de datos.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';

interface AnalyticsEvent {
  type: 'page_view' | 'chapter_read' | 'chapter_complete' | 'time_spent' | 'scroll_depth' | 'comment' | 'like';
  mangaId?: string;
  chapterId?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsData {
  views: number;
  reads: number;
  completions: number;
  avgTimeSpent: number;
  avgScrollDepth: number;
  popularChapters: Array<{ chapterId: string; chapterNumber: number; views: number }>;
  dailyStats: Array<{ date: string; views: number; reads: number }>;
}

// Track event
export function trackEvent(event: AnalyticsEvent) {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't block UX
    });
  } catch {
    // Ignore errors
  }
}

// Hook para chapter reading
export function useChapterAnalytics(chapterId: string, mangaId: string) {
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const hasTrackedReadRef = useRef<boolean>(false);
  const hasTrackedCompleteRef = useRef<boolean>(false);

  // Track page view
  useEffect(() => {
    trackEvent({
      type: 'page_view',
      mangaId,
      chapterId,
    });

    // Track read after 5 seconds
    const readTimer = setTimeout(() => {
      if (!hasTrackedReadRef.current) {
        trackEvent({
          type: 'chapter_read',
          mangaId,
          chapterId,
        });
        hasTrackedReadRef.current = true;
      }
    }, 5000);

    return () => {
      clearTimeout(readTimer);
      // Track time spent on unmount
      const timeSpent = Date.now() - startTimeRef.current;
      trackEvent({
        type: 'time_spent',
        mangaId,
        chapterId,
        metadata: { duration: timeSpent },
      });
    };
  }, [chapterId, mangaId]);

  // Track scroll depth
  const trackScroll = useCallback(() => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercent;
    }

    // Track completion at 90%
    if (scrollPercent >= 90 && !hasTrackedCompleteRef.current) {
      trackEvent({
        type: 'chapter_complete',
        mangaId,
        chapterId,
        metadata: { scrollDepth: scrollPercent },
      });
      hasTrackedCompleteRef.current = true;
    }
  }, [chapterId, mangaId]);

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(trackScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScroll]);

  return {
    trackComment: () => trackEvent({ type: 'comment', mangaId, chapterId }),
    trackLike: () => trackEvent({ type: 'like', mangaId, chapterId }),
  };
}

// Hook para obtener analytics
export function useAnalytics(mangaId?: string, dateRange?: { from: Date; to: Date }) {
  const fetchAnalytics = useCallback(async (): Promise<AnalyticsData | null> => {
    try {
      const params = new URLSearchParams();
      if (mangaId) params.append('mangaId', mangaId);
      if (dateRange) {
        params.append('from', dateRange.from.toISOString());
        params.append('to', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }, [mangaId, dateRange]);

  return { fetchAnalytics };
}
