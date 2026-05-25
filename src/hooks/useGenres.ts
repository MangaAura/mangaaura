'use client';

import { useEffect, useState } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

export interface GenreFromApi {
  id: string;
  name: string;
  slug: string;
}

interface UseGenresReturn {
  genres: GenreFromApi[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch all genres from the API.
 */
export function useGenres(): UseGenresReturn {
  const [genres, setGenres] = useState<GenreFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGenres() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/genres');
        if (!response.ok) {
          const { message } = await extractApiError(response);
          throw new Error(message);
        }
        const data = await response.json();
        if (!cancelled) {
          setGenres(data.genres || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchGenres();

    return () => {
      cancelled = true;
    };
  }, []);

  return { genres, isLoading, error };
}
