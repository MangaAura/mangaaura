/**
 * useChapterComments Hook
 * 
 * Hook para gestionar comentarios de capítulos.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

export interface Comment {
  id: string;
  chapterId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  parentId?: string;
  likesCount: number;
  isLiked?: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface UseChapterCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  createComment: (content: string, parentId?: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

export function useChapterComments(chapterId: string): UseChapterCommentsReturn {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Cargar comentarios
  const fetchComments = useCallback(async (pageNum: number = 1) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments?page=${pageNum}&limit=20`);
      
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      
      setHasMore(data.comments.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  // Cargar más
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setIsLoading(true);
    await fetchComments(nextPage);
    setPage(nextPage);
  }, [page, fetchComments]);

  // Crear comentario
  const createComment = useCallback(async (content: string, parentId?: string) => {
    if (!session?.user) {
      throw new Error('Must be logged in');
    }

    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const newComment = await response.json();
      
      if (parentId) {
        // Agregar como reply
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          )
        );
      } else {
        // Agregar como comentario principal
        setComments((prev) => [newComment, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [chapterId, session]);

  // Actualizar comentario
  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const updatedComment = await response.json();
      
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [chapterId]);

  // Eliminar comentario
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setComments((prev) =>
        prev.filter((c) => c.id !== commentId && !c.replies?.some((r) => r.id === commentId))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [chapterId]);

  // Like comentario
  const likeComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likesCount: c.likesCount + 1, isLiked: true }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [chapterId]);

  // Unlike comentario
  const unlikeComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/comments/${commentId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likesCount: Math.max(0, c.likesCount - 1), isLiked: false }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [chapterId]);

  // Cargar inicial
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (chapterId) {
      fetchComments(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  return {
    comments,
    isLoading,
    error,
    hasMore,
    loadMore,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
  };
}

export default useChapterComments;
