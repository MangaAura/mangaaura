/**
 * useTags Hook
 *
 * Hook for managing tags: list with hierarchy, CRUD for admins, and manga tag association.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  parentId: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  parent?: Tag | null;
  children?: Tag[];
}

interface UseTagsReturn {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: (params?: { type?: string; parentId?: string | null; includeChildren?: boolean }) => Promise<void>;
  fetchTag: (id: string) => Promise<Tag | null>;
  createTag: (data: {
    name: string;
    description?: string;
    type?: string;
    parentId?: string;
    color?: string;
    order?: number;
  }) => Promise<Tag | null>;
  updateTag: (id: string, data: Partial<{
    name: string;
    description: string;
    type: string;
    parentId: string | null;
    color: string;
    order: number;
    isActive: boolean;
  }>) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
}

export function useTags(): UseTagsReturn {
  const { data: session } = useSession();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async (params?: {
    type?: string;
    parentId?: string | null;
    includeChildren?: boolean;
  }) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.parentId === 'null') searchParams.set('parentId', 'null');
      else if (params?.parentId) searchParams.set('parentId', params.parentId);
      if (params?.includeChildren) searchParams.set('includeChildren', 'true');

      const response = await fetch(`/api/tags?${searchParams.toString()}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tags');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const fetchTag = useCallback(async (id: string): Promise<Tag | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch(`/api/tags/${id}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      return data.tag || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tag');
      return null;
    }
  }, [session?.user?.id]);

  const createTag = useCallback(async (data: {
    name: string;
    description?: string;
    type?: string;
    parentId?: string;
    color?: string;
    order?: number;
  }): Promise<Tag | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const tag = await response.json();
      setTags((prev) => [...prev, tag]);
      return tag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tag');
      return null;
    }
  }, [session?.user?.id]);

  const updateTag = useCallback(async (id: string, data: Partial<{
    name: string;
    description: string;
    type: string;
    parentId: string | null;
    color: string;
    order: number;
    isActive: boolean;
  }>): Promise<Tag | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const updated = await response.json();
      setTags((prev) => prev.map((t) => t.id === id ? updated.tag : t));
      return updated.tag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tag');
      return null;
    }
  }, [session?.user?.id]);

  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setError(null);

      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setTags((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tag');
      return false;
    }
  }, [session?.user?.id]);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    fetchTag,
    createTag,
    updateTag,
    deleteTag,
  };
}
