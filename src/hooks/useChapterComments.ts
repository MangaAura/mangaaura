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
  voteCount?: number;
  userVote?: number | null;
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
  voteComment: (commentId: string, value: 1 | -1) => Promise<void>;
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

  function updateNested(comment: Comment, targetId: string, data: { voted: boolean; value: number | null }, currentValue: 1 | -1): Comment {
    if (comment.id === targetId) {
      const prevVote = comment.userVote ?? 0;
      const prevCount = comment.voteCount ?? 0;
      if (data.voted) {
        const diff = data.value! - prevVote;
        return { ...comment, userVote: data.value, voteCount: prevCount + diff };
      }
      return { ...comment, userVote: null, voteCount: prevCount - prevVote };
    }
    if (comment.replies) {
      return { ...comment, replies: comment.replies.map((r) => updateNested(r, targetId, data, currentValue)) };
    }
    return comment;
  }

  // Vote comment
  const voteComment = useCallback(async (commentId: string, value: 1 | -1) => {
    try {
      const response = await fetch(`/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: commentId,
          targetType: 'COMMENT',
          value,
        }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();

      setComments((prev) =>
        prev.map((c) => {
          const updated = updateNested(c, commentId, data, value);
          return updated;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Cargar inicial
  useEffect(() => {
    if (chapterId) {
      queueMicrotask(() => { void fetchComments(1); });
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
    voteComment,
  };
}

export default useChapterComments;
