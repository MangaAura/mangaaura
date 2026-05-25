'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useMemo, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { invalidateMangaCache } from '@/lib/cache';
import { extractApiError } from '@/lib/extract-api-error';
import { swrConfigs, fetcher } from '@/lib/swr-config';

// Tipos exportados
export interface Manga {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED';
  tags: string[];
  authorId: string;
  authorName: string;
  rating: number;
  totalViews: number;
  createdAt: string;
  updatedAt?: string;
  chapters?: Chapter[];
  stats?: {
    totalViews: number;
    totalReaders: number;
    monthlyGrowth: number;
    avgViewsPerChapter: number;
  };
  _count?: {
    chapters: number;
  };
}

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  pageCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  crowdfunding?: {
    goal: number;
    current: number;
    isFunded: boolean;
    progress: number;
  } | null;
}

export interface CreateMangaInput {
  title: string;
  description: string;
  coverUrl?: string;
  status?: Manga['status'];
  tags?: string[];
}

export interface UpdateMangaInput {
  title?: string;
  description?: string;
  coverUrl?: string;
  status?: Manga['status'];
  tags?: string[];
}

export interface CreateChapterInput {
  mangaId: string;
  chapterNumber: number;
  title?: string;
  pageCount: number;
}

export interface UpdateChapterInput {
  title?: string;
  chapterNumber?: number;
}

export interface UseMangaOptions {
  mangaId?: string;
  page?: number;
  limit?: number;
  search?: string;
  swrOptions?: SWRConfiguration;
}

export interface UseMangaReturn {
  mangas: Manga[];
  manga: Manga | null;
  chapters: Chapter[];
  isLoading: boolean;
  isValidating: boolean;
  isMutating: boolean;
  error: Error | null;
  createManga: (input: CreateMangaInput) => Promise<Manga | null>;
  updateManga: (id: string, input: UpdateMangaInput) => Promise<Manga | null>;
  deleteManga: (id: string) => Promise<boolean>;
  createChapter: (input: CreateChapterInput) => Promise<Chapter | null>;
  updateChapter: (id: string, input: UpdateChapterInput) => Promise<Chapter | null>;
  deleteChapter: (id: string) => Promise<boolean>;
  loadMangas: (options?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  mutate: (data?: { mangas?: Manga[]; manga?: Manga | null; chapters?: Chapter[] }, shouldRevalidate?: boolean) => Promise<void>;
}

export function useManga(options: UseMangaOptions = {}): UseMangaReturn {
  const { mangaId, page: initialPage = 1, limit: initialLimit = 20, search: initialSearch, swrOptions = {} } = options;
  const { data: session } = useSession();
  const [isMutating, setIsMutating] = useState(false);
  const { handleError } = useErrorHandler();

  const listKey = useMemo(() => {
    if (mangaId) return null;
    return `/api/manga?page=${initialPage}&limit=${initialLimit}${initialSearch ? `&search=${encodeURIComponent(initialSearch)}` : ''}`;
  }, [mangaId, initialPage, initialLimit, initialSearch]);

  const detailKey = useMemo(() => {
    if (!mangaId) return null;
    return `/api/manga/${mangaId}`;
  }, [mangaId]);

  const { data: listData, error: listError, isLoading: isListLoading, isValidating: isListValidating, mutate: mutateList } = 
    useSWR<{ mangas: Manga[]; pagination: { total: number; totalPages: number } }>(listKey, listKey ? fetcher : null, { ...swrConfigs.mangaList, ...swrOptions });

  const { data: detailData, error: detailError, isLoading: isDetailLoading, isValidating: isDetailValidating, mutate: mutateDetail } = 
    useSWR<{ manga: Manga; chapters: Chapter[] }>(detailKey, detailKey ? fetcher : null, { ...swrConfigs.mangaDetail, ...swrOptions });

  const isLoading = mangaId ? isDetailLoading : isListLoading;
  const isValidating = mangaId ? isDetailValidating : isListValidating;
  const error = mangaId ? detailError : listError;

  const mangas = listData?.mangas || [];
  const manga = detailData?.manga || null;
  const chapters = detailData?.chapters || [];

  const fetchWithAuth = useCallback(async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
    if (!response.ok) {
      const { message } = await extractApiError(response);
      throw new Error(message);
    }
    return response.json();
  }, []);

  const loadMangas = useCallback(async (opts: { page?: number; limit?: number; search?: string } = {}) => {
    const { page = initialPage, limit = initialLimit, search = initialSearch } = opts;
    const key = `/api/manga?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
    await mutateList(fetcher(key), { revalidate: true });
  }, [initialPage, initialLimit, initialSearch, mutateList]);

  const createManga = useCallback(async (input: CreateMangaInput): Promise<Manga | null> => {
    if (!session?.user) return null;
    setIsMutating(true);
    try {
      const data = await fetchWithAuth<{ manga: Manga }>('/api/manga', { method: 'POST', body: JSON.stringify(input) });
      await mutateList((current) => current ? { ...current, mangas: [data.manga, ...current.mangas] } : current, false);
      await invalidateMangaCache();
      return data.manga;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateList, session]);

  const updateManga = useCallback(async (id: string, input: UpdateMangaInput): Promise<Manga | null> => {
    if (!session?.user) return null;
    setIsMutating(true);
    try {
      const data = await fetchWithAuth<{ manga: Manga }>(`/api/manga/${id}`, { method: 'PUT', body: JSON.stringify(input) });
      if (mangaId === id) {
        await mutateDetail((current) => current ? { ...current, manga: data.manga } : current, false);
      }
      await mutateList((current) => current ? { ...current, mangas: current.mangas.map((m) => (m.id === id ? data.manga : m)) } : current, false);
      await invalidateMangaCache(id);
      return data.manga;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateList, mutateDetail, mangaId, session]);

  const deleteManga = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.user) return false;
    setIsMutating(true);
    try {
      await fetchWithAuth(`/api/manga/${id}`, { method: 'DELETE' });
      await mutateList((current) => current ? { ...current, mangas: current.mangas.filter((m) => m.id !== id) } : current, false);
      if (mangaId === id) await mutateDetail(undefined, { revalidate: false });
      await invalidateMangaCache(id);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateList, mutateDetail, mangaId, session]);

  const createChapter = useCallback(async (input: CreateChapterInput): Promise<Chapter | null> => {
    if (!session?.user) return null;
    setIsMutating(true);
    try {
      const data = await fetchWithAuth<{ chapter: Chapter }>('/api/chapters', { method: 'POST', body: JSON.stringify(input) });
      if (mangaId === input.mangaId) {
        await mutateDetail((current) => current ? { ...current, chapters: [...current.chapters, data.chapter] } : current, false);
      }
      await invalidateMangaCache(input.mangaId);
      return data.chapter;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateDetail, mangaId, session]);

  const updateChapter = useCallback(async (id: string, input: UpdateChapterInput): Promise<Chapter | null> => {
    if (!session?.user) return null;
    setIsMutating(true);
    try {
      const data = await fetchWithAuth<{ chapter: Chapter }>(`/api/chapters/${id}`, { method: 'PUT', body: JSON.stringify(input) });
      await mutateDetail((current) => current ? { ...current, chapters: current.chapters.map((c) => (c.id === id ? data.chapter : c)) } : current, false);
      if (manga?.id) await invalidateMangaCache(manga.id);
      return data.chapter;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateDetail, manga?.id, session]);

  const deleteChapter = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.user) return false;
    setIsMutating(true);
    try {
      await fetchWithAuth(`/api/chapters/${id}`, { method: 'DELETE' });
      await mutateDetail((current) => current ? { ...current, chapters: current.chapters.filter((c) => c.id !== id) } : current, false);
      if (manga?.id) await invalidateMangaCache(manga.id);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [fetchWithAuth, mutateDetail, manga?.id, session]);

  const refresh = useCallback(async () => {
    if (mangaId) await mutateDetail();
    else await mutateList();
  }, [mangaId, mutateDetail, mutateList]);

  const mutateData = useCallback(async (data?: { mangas?: Manga[]; manga?: Manga | null; chapters?: Chapter[] }, shouldRevalidate = true) => {
    if (data?.mangas !== undefined) {
      await mutateList({ mangas: data.mangas, pagination: listData?.pagination || { total: data.mangas.length, totalPages: 1 } }, { revalidate: shouldRevalidate });
    }
    if (data?.manga !== undefined || data?.chapters !== undefined) {
      const newData = data?.manga || data?.chapters
        ? { manga: (data.manga || manga) as Manga, chapters: data.chapters || chapters }
        : undefined;
      if (newData) {
        await mutateDetail(newData, { revalidate: shouldRevalidate });
      }
    }
  }, [mutateList, mutateDetail, listData, manga, chapters]);

  return { mangas, manga, chapters, isLoading, isValidating, isMutating, error, createManga, updateManga, deleteManga, createChapter, updateChapter, deleteChapter, loadMangas, refresh, mutate: mutateData };
}

export function useMangaData(mangaId: string, swrOptions?: SWRConfiguration) {
  return useManga({ mangaId, swrOptions });
}

export default useManga;
