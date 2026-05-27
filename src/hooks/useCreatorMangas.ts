'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState, useMemo, useRef } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

import { swrConfigs, fetcher } from '@/lib/swr-config';

export interface CreatorMangaStats {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED';
  tags: string[];
  chapterCount: number;
  totalViews: number;
  rating: number;
  viewsLast30Days: number;
  createdAt: string;
  updatedAt: string;
  engagement?: {
    totalComments: number;
    followers: number;
    completionRate: number;
  };
}

export interface TrashMangaStats {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
  totalViews: number;
  deletedAt: string;
  daysLeft: number;
  createdAt: string;
}

export interface CreatorDashboardStats {
  totalMangas: number;
  totalChapters: number;
  totalViews: number;
  totalReaders?: number;
  viewsThisMonth: number;
  viewsThisWeek: number;
  averageRating: number;
  growthRate: number;
}

export interface CreatorMangasFilters {
  status?: CreatorMangaStats['status'];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalViews' | 'rating' | 'chapterCount';
  sortOrder?: 'asc' | 'desc';
}

export interface UseCreatorMangasOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  initialPage?: number;
  pageSize?: number;
  swrOptions?: SWRConfiguration;
}

export interface UseCreatorMangasReturn {
  mangas: CreatorMangaStats[];
  dashboardStats: CreatorDashboardStats | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalMangas: number;
  filters: CreatorMangasFilters;
  setFilters: (filters: CreatorMangasFilters | ((prev: CreatorMangasFilters) => CreatorMangasFilters)) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => Promise<void>;
  updateMangaOptimistic: (id: string, updates: Partial<CreatorMangaStats>) => void;
  deleteManga: (id: string) => Promise<void>;
  revertOptimisticUpdate: () => void;
  clear: () => void;
}

interface CreatorMangasResponse {
  mangas: CreatorMangaStats[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  dashboardStats: CreatorDashboardStats;
}

export function useCreatorMangas(options: UseCreatorMangasOptions = {}): UseCreatorMangasReturn {
  const { refreshInterval = 30000, autoRefresh = true, initialPage = 1, pageSize = 20, swrOptions = {} } = options;
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFiltersState] = useState<CreatorMangasFilters>({});
  
  const previousStateRef = useRef<{ mangas: CreatorMangaStats[]; dashboardStats: CreatorDashboardStats | null } | null>(null);

  const cacheKey = useMemo(() => {
    if (status !== 'authenticated' || !session?.user?.id) return null;
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('limit', pageSize.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    return `/api/creator/mangas?${params.toString()}`;
  }, [session?.user?.id, status, currentPage, pageSize, filters]);

  const { data, error, isLoading, isValidating, mutate: mutateData } = useSWR<CreatorMangasResponse>(
    cacheKey,
    cacheKey ? fetcher : null,
    { ...swrConfigs.creatorDashboard, refreshInterval: autoRefresh ? refreshInterval : 0, ...swrOptions }
  );

  const mangas = data?.mangas || [];
  const dashboardStats = data?.dashboardStats || null;
  const totalMangas = data?.pagination.total || 0;
  const totalPages = data?.pagination.totalPages || 1;

  const setFilters = useCallback((newFilters: CreatorMangasFilters | ((prev: CreatorMangasFilters) => CreatorMangasFilters)) => {
    setFiltersState((prev) => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
      return { ...prev, ...updated };
    });
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const previousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const refresh = useCallback(async () => {
    await mutateData();
  }, [mutateData]);

  const updateMangaOptimistic = useCallback((id: string, updates: Partial<CreatorMangaStats>) => {
    previousStateRef.current = { mangas: [...mangas], dashboardStats };
    mutateData(
      (current) => {
        if (!current) return current;
        return { ...current, mangas: current.mangas.map((manga) => (manga.id === id ? { ...manga, ...updates } : manga)) };
      },
      { revalidate: false }
    );
  }, [mangas, dashboardStats, mutateData]);

  const deleteManga = useCallback(async (id: string) => {
    previousStateRef.current = { mangas: [...mangas], dashboardStats };
    mutateData(
      (current) => {
        if (!current) return current;
        return { ...current, mangas: current.mangas.filter((manga) => manga.id !== id) };
      },
      { revalidate: false }
    );
    try {
      const response = await fetch(`/api/manga/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error al eliminar' }));
        throw new Error(err.error || 'Error al eliminar el manga');
      }
      await mutateData();
    } catch (error) {
      if (previousStateRef.current) {
        mutateData(
          { mangas: previousStateRef.current.mangas, pagination: data?.pagination || { page: 1, limit: pageSize, total: previousStateRef.current.mangas.length, totalPages: 1 }, dashboardStats: previousStateRef.current.dashboardStats || { totalMangas: 0, totalChapters: 0, totalViews: 0, viewsThisMonth: 0, viewsThisWeek: 0, averageRating: 0, growthRate: 0 } },
          { revalidate: false }
        );
        previousStateRef.current = null;
      }
      throw error;
    }
  }, [mangas, dashboardStats, data?.pagination, pageSize, mutateData]);

  const revertOptimisticUpdate = useCallback(() => {
    if (previousStateRef.current) {
      mutateData({ mangas: previousStateRef.current.mangas, pagination: data?.pagination || { page: 1, limit: pageSize, total: previousStateRef.current.mangas.length, totalPages: 1 }, dashboardStats: previousStateRef.current.dashboardStats || { totalMangas: 0, totalChapters: 0, totalViews: 0, viewsThisMonth: 0, viewsThisWeek: 0, averageRating: 0, growthRate: 0 } }, { revalidate: false });
      previousStateRef.current = null;
    }
  }, [mutateData, data?.pagination, pageSize]);

  const clear = useCallback(() => {
    setCurrentPage(1);
    setFiltersState({});
    previousStateRef.current = null;
  }, []);

  return { mangas, dashboardStats, isLoading, isValidating, error, currentPage, totalPages, totalMangas, filters, setFilters, goToPage, nextPage, previousPage, refresh, updateMangaOptimistic, deleteManga, revertOptimisticUpdate, clear };
}

export default useCreatorMangas;
