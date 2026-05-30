/**
 * useMongoAnalytics Hook
 *
 * Hook para obtener estadísticas de MongoDB para creadores.
 * Integra el servicio de analytics con React Query (o fetch directo).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

interface ChapterStats {
  chapterId: string;
  mangaId: string;
  reads: number;
  completions: number;
  completionRate: number;
}

interface CreatorStatsResponse {
  totalViews: number;
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  chapterStats: ChapterStats[];
}

interface UseMongoAnalyticsOptions {
  mangaIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export function useMongoAnalytics(options: UseMongoAnalyticsOptions = {}) {
  const [data, setData] = useState<CreatorStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mangaIdsStr = options.mangaIds?.join(',') ?? '';
  const dateFromStr = options.dateFrom?.toISOString() ?? '';
  const dateToStr = options.dateTo?.toISOString() ?? '';

  const fetchStats = useCallback(async () => {
    if (!mangaIdsStr) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mangaIds = mangaIdsStr.split(',').filter(Boolean);
      const params = new URLSearchParams();
      mangaIds.forEach((id) => params.append('mangaIds', id));
      if (dateFromStr) {
        params.append('dateFrom', dateFromStr);
      }
      if (dateToStr) {
        params.append('dateTo', dateToStr);
      }

      const response = await fetch(`/api/analytics/creator?${params.toString()}`);

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [mangaIdsStr, dateFromStr, dateToStr]);

  useEffect(() => {
    const timer = setTimeout(() => fetchStats(), 0);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export default useMongoAnalytics;
