'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/swr-config';

interface HomeStats {
  totalMangas: number;
  totalReaders: number;
  totalChapters: number;
}

interface UseHomeStatsOptions {
  fallbackData?: HomeStats;
}

interface UseHomeStatsReturn {
  stats: HomeStats;
  isLoading: boolean;
  error: string | null;
}

export function useHomeStats(options: UseHomeStatsOptions = {}): UseHomeStatsReturn {
  const { data, error, isLoading } = useSWR<HomeStats>(
    '/api/stats',
    fetcher,
    {
      fallbackData: options.fallbackData,
      refreshInterval: 60_000, // 1 minuto
      revalidateOnFocus: true,
      dedupingInterval: 30_000, // 30 segundos
      keepPreviousData: true,
    },
  );

  return {
    stats: data ?? { totalMangas: 0, totalReaders: 0, totalChapters: 0 },
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error al cargar estadísticas') : null,
  };
}
