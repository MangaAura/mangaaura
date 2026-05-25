/**
 * useBookmarks Hook
 *
 * Hook for managing bookmarks with public/private visibility support.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

export interface Bookmark {
  id: string;
  userId: string;
  mangaId: string;
  chapterId: string | null;
  page: number;
  note: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  manga?: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  chapter?: {
    id: string;
    title: string;
    chapterNumber: number;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  fetchBookmarks: (params?: {
    page?: number;
    limit?: number;
    mangaId?: string;
    chapterId?: string;
    publicOnly?: boolean;
  }) => Promise<void>;
  createBookmark: (data: {
    mangaId: string;
    chapterId?: string;
    page?: number;
    note?: string;
    isPublic?: boolean;
  }) => Promise<Bookmark | null>;
  deleteBookmark: (id: string) => Promise<boolean>;
  toggleBookmarkVisibility: (id: string, isPublic: boolean) => Promise<boolean>;
}

export function useBookmarks(): UseBookmarksReturn {
  const { data: session } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchBookmarks = useCallback(async (params?: {
    page?: number;
    limit?: number;
    mangaId?: string;
    chapterId?: string;
    publicOnly?: boolean;
  }) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.mangaId) searchParams.set('mangaId', params.mangaId);
      if (params?.chapterId) searchParams.set('chapterId', params.chapterId);
      if (params?.publicOnly) searchParams.set('public', 'true');

      const response = await fetch(`/api/bookmarks?${searchParams.toString()}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      setBookmarks(data.bookmarks || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar marcadores');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const createBookmark = useCallback(async (data: {
    mangaId: string;
    chapterId?: string;
    page?: number;
    note?: string;
    isPublic?: boolean;
  }): Promise<Bookmark | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const bookmark = await response.json();
      setBookmarks((prev) => [bookmark, ...prev]);
      return bookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear marcador');
      return null;
    }
  }, [session?.user?.id]);

  const deleteBookmark = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setError(null);

      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar marcador');
      return false;
    }
  }, [session?.user?.id]);

  const toggleBookmarkVisibility = useCallback(async (id: string, isPublic: boolean): Promise<boolean> => {
    if (!session?.user?.id) return false;

    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPublic } : b))
    );

    try {
      setError(null);

      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      return true;
    } catch (err) {
      // Rollback on error
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isPublic: !isPublic } : b))
      );
      setError(err instanceof Error ? err.message : 'Error al cambiar visibilidad');
      return false;
    }
  }, [session?.user?.id]);

  return {
    bookmarks,
    isLoading,
    error,
    pagination,
    fetchBookmarks,
    createBookmark,
    deleteBookmark,
    toggleBookmarkVisibility,
  };
}
