/**
 * useLibrary Hook
 * 
 * Maneja el estado de la biblioteca del usuario con SWR.
 */

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { fetcher, getErrorMessage } from '@/lib/swr-config';

export type LibraryStatus = 'READING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED' | 'PLAN_TO_READ';

export interface LibraryEntry {
  id: string;
  mangaId: string;
  status: LibraryStatus;
  currentChapter: number;
  rating?: number;
  addedAt: string;
  updatedAt: string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl?: string;
    status: string;
    authorName: string;
    totalViews: number;
    rating?: number;
  };
  totalChapters: number;
  progress: number;
}

interface LibraryData {
  entries: LibraryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface LibraryFilters {
  status?: LibraryStatus;
  sort?: 'updatedAt' | 'title' | 'rating' | 'progress';
  page?: number;
  limit?: number;
}

// Get cache key for library
const getLibraryKey = (filters: LibraryFilters) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  
  const queryString = params.toString();
  return queryString ? `/api/library?${queryString}` : '/api/library';
};

/**
 * Hook for fetching user's library
 */
export function useLibrary(filters: LibraryFilters = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LibraryData>(
    getLibraryKey(filters),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s
    }
  );

  return {
    entries: data?.entries || [],
    pagination: data?.pagination,
    isLoading,
    isValidating,
    error: error ? getErrorMessage(error) : null,
    mutate,
  };
}

/**
 * Hook for adding manga to library
 */
export function useAddToLibrary() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/library',
    async (url: string, { arg }: { arg: { mangaId: string; status?: LibraryStatus } }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to library');
      }
      
      return response.json();
    }
  );

  return {
    addToLibrary: trigger,
    isLoading: isMutating,
    error: error ? getErrorMessage(error) : null,
  };
}

/**
 * Hook for updating library entry
 */
export function useUpdateLibraryEntry(mangaId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    mangaId ? `/api/library/${mangaId}` : null,
    async (url: string, { arg }: { arg: { status?: LibraryStatus; rating?: number; currentChapter?: number } }) => {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update entry');
      }
      
      return response.json();
    }
  );

  return {
    updateEntry: trigger,
    isLoading: isMutating,
    error: error ? getErrorMessage(error) : null,
  };
}

/**
 * Hook for removing from library
 */
export function useRemoveFromLibrary(mangaId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    mangaId ? `/api/library/${mangaId}` : null,
    async (url: string) => {
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove from library');
      }
      
      return response.json();
    }
  );

  return {
    removeFromLibrary: trigger,
    isLoading: isMutating,
    error: error ? getErrorMessage(error) : null,
  };
}

/**
 * Check if manga is in user's library
 */
export function useLibraryStatus(mangaId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    mangaId ? `/api/library/${mangaId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    entry: data,
    isInLibrary: !!data,
    isLoading,
    error: error ? getErrorMessage(error) : null,
  };
}

export default useLibrary;
