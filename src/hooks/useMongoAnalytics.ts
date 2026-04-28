/**
 * useMongoAnalytics Hook
 *
 * Hook para obtener estadísticas de MongoDB para creadores.
 * Integra el servicio de analytics con React Query (o fetch directo).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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

  const fetchStats = useCallback(async () => {
    if (!options.mangaIds || options.mangaIds.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      options.mangaIds.forEach((id) => params.append('mangaIds', id));
      if (options.dateFrom) {
        params.append('dateFrom', options.dateFrom.toISOString());
      }
      if (options.dateTo) {
        params.append('dateTo', options.dateTo.toISOString());
      }

      const response = await fetch(`/api/analytics/creator?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options.mangaIds?.join(','), options.dateFrom?.toISOString(), options.dateTo?.toISOString()]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export default useMongoAnalytics;
