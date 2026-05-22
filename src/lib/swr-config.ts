import { SWRConfiguration } from 'swr';

// Base fetcher function with error handling
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Retry configuration with exponential backoff
const retryOptions = {
  errorRetryCount: 3,
  shouldRetryOnError: (error: Error) => {
    // Don't retry on 4xx errors (client errors)
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
      return false;
    }
    return true;
  },
};

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Data refresh interval (revalidate every 5 minutes)
  refreshInterval: 5 * 60 * 1000,
  
  // Revalidate when window regains focus (disabled globally to reduce requests)
  revalidateOnFocus: false,
  
  // Revalidate on reconnect
  revalidateOnReconnect: false,
  
  // Revalidate if stale
  revalidateIfStale: false,
  
  // Keep previous data while fetching new data
  keepPreviousData: true,
  
  // Enable deduping interval (requests within this time frame will be deduplicated)
  dedupingInterval: 2000, // 2 seconds
  
  // Loading timeout
  loadingTimeout: 3000,
  
  // Retry interval
  errorRetryInterval: 1000,
  
  // Retry options
  ...retryOptions,
  
  // Custom fetcher
  fetcher,
  
  // Suspense mode (disabled by default)
  suspense: false,
};

// Infinite scroll pagination helpers
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// SWR infinite key generator for paginated endpoints
export function getPaginatedKey(
  baseUrl: string,
  page: number,
  filters?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    });
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// SWR fetcher with pagination support (for infinite scroll)
export const paginatedFetcher = async <T>(url: string): Promise<{ data: T[]; pagination: PaginationMeta }> => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Support both { data, pagination } and direct { items, pagination } formats
  if (result.pagination) {
    return {
      data: result.data || result.items || result.entries || result.mangas || result,
      pagination: result.pagination,
    };
  }
  
  return result;
};

// Specific configurations for different data types
export const swrConfigs = {
  // Manga list - revalidate every 5 minutes
  mangaList: {
    ...swrConfig,
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: true,
    revalidateFirstPage: false,
  },
  
  // Manga detail - revalidate every 10 minutes
  mangaDetail: {
    ...swrConfig,
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  },
  
  // User profile - revalidate every 3 minutes
  userProfile: {
    ...swrConfig,
    refreshInterval: 3 * 60 * 1000,
    revalidateOnFocus: true,
  },
  
  // Leaderboard - revalidate every minute
  leaderboard: {
    ...swrConfig,
    refreshInterval: 60 * 1000,
    revalidateOnFocus: true,
  },
  
  // Search results - no auto refresh, dedupe aggressively
  search: {
    ...swrConfig,
    refreshInterval: 0, // Don't auto refresh
    dedupingInterval: 5000, // 5 seconds dedupe
    revalidateOnFocus: false,
  },
  
  // Comments - frequent updates with pagination
  comments: {
    ...swrConfig,
    refreshInterval: 30 * 1000, // 30 seconds
    revalidateOnFocus: true,
    revalidateFirstPage: false,
    keepPreviousData: true,
  },
  
  // Analytics - moderate updates
  analytics: {
    ...swrConfig,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    revalidateOnFocus: true,
  },
  
  // Creator dashboard - moderate updates
  creatorDashboard: {
    ...swrConfig,
    refreshInterval: 30 * 1000, // 30 seconds
    revalidateOnFocus: true,
  },
  
  // Library with pagination - for infinite scroll
  libraryPaginated: {
    ...swrConfig,
    refreshInterval: 3 * 60 * 1000,
    revalidateOnFocus: true,
    keepPreviousData: true,
    revalidateFirstPage: false,
  },
  
  // Notifications - poll for updates
  notifications: {
    ...swrConfig,
    refreshInterval: 60 * 1000, // 1 minute
    revalidateOnFocus: true,
    dedupingInterval: 10000, // 10 seconds
  },
  
  // Static content - minimal updates
  static: {
    ...swrConfig,
    refreshInterval: 60 * 60 * 1000, // 1 hour
    revalidateOnFocus: false,
    dedupingInterval: 60 * 1000, // 1 minute
  },
};

// Mutation options for optimistic updates
export const mutationOptions = {
  // Rollback on error
  rollbackOnError: true,
  
  // Revalidate after mutation
  revalidate: true,
  
  // Optimistic data function type
  populateCache: false,
};

// Prefetch helper
export const prefetchData = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Prefetch failed');
    return await response.json();
  } catch (error) {
    console.error('Prefetch error:', error);
    return null;
  }
};

// Error message helper
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

// Mutate with loading state helper
export const mutateWithLoading = async <T>(
  mutateFn: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
): Promise<T | null> => {
  try {
    const data = await mutateFn();
    onSuccess?.(data);
    return data;
  } catch (error) {
    onError?.(error as Error);
    return null;
  }
};
