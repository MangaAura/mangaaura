'use client';

import useSWR from 'swr';

import { fetcher, getErrorMessage } from '@/lib/swr-config';

export interface GenreFromApi {
  id: string;
  name: string;
  slug: string;
}

interface GenresResponse {
  genres: GenreFromApi[];
}

interface UseGenresReturn {
  genres: GenreFromApi[];
  isLoading: boolean;
  error: string | null;
}

export function useGenres(): UseGenresReturn {
  const { data, error, isLoading } = useSWR<GenresResponse>(
    '/api/genres',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 5 * 60 * 1000,
    }
  );

  return {
    genres: data?.genres ?? [],
    isLoading,
    error: error ? getErrorMessage(error) : null,
  };
}
