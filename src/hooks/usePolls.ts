/**
 * usePolls Hook
 *
 * Hook for managing polls: list, create, vote, and manage poll lifecycle.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  order: number;
  _count?: { votes: number };
  voteCount?: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  question: string;
  description: string | null;
  type: string;
  status: string;
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  options: PollOption[];
  _count?: { votes: number };
  totalVotes?: number;
  userVotedOptionId?: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UsePollsReturn {
  polls: Poll[];
  currentPoll: Poll | null;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  fetchPolls: (params?: { status?: string; page?: number; limit?: number }) => Promise<void>;
  fetchPoll: (id: string) => Promise<void>;
  createPoll: (data: {
    question: string;
    description?: string;
    type?: string;
    options: string[];
    expiresAt?: string;
  }) => Promise<Poll | null>;
  vote: (pollId: string, optionId: string) => Promise<boolean>;
  removeVote: (pollId: string) => Promise<boolean>;
  deletePoll: (id: string) => Promise<boolean>;
  updatePoll: (id: string, data: Partial<{
    question: string;
    description: string;
    status: string;
    expiresAt: string | null;
  }>) => Promise<Poll | null>;
}

export function usePolls(): UsePollsReturn {
  const { data: session } = useSession();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchPolls = useCallback(async (params?: { status?: string; page?: number; limit?: number }) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const response = await fetch(`/api/polls?${searchParams.toString()}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      setPolls(data.polls || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar encuestas');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const fetchPoll = useCallback(async (id: string) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/polls/${id}`);
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const data = await response.json();
      setCurrentPoll(data.poll || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar encuesta');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const createPoll = useCallback(async (data: {
    question: string;
    description?: string;
    type?: string;
    options: string[];
    expiresAt?: string;
  }): Promise<Poll | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const poll = await response.json();
      setPolls((prev) => [poll, ...prev]);
      return poll;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear encuesta');
      return null;
    }
  }, [session?.user?.id]);

  const vote = async (pollId: string, optionId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setError(null);

      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      if (currentPoll?.id === pollId) {
        setCurrentPoll((prev) => prev ? { ...prev, userVotedOptionId: optionId } : prev);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al votar');
      return false;
    }
  };

  const removeVote = async (pollId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setError(null);

      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      if (currentPoll?.id === pollId) {
        setCurrentPoll((prev) => prev ? { ...prev, userVotedOptionId: null } : prev);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al retirar voto');
      return false;
    }
  };

  const deletePoll = async (id: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setError(null);

      const response = await fetch(`/api/polls/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setPolls((prev) => prev.filter((p) => p.id !== id));
      if (currentPoll?.id === id) setCurrentPoll(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar encuesta');
      return false;
    }
  };

  const updatePoll = async (id: string, data: Partial<{
    question: string;
    description: string;
    status: string;
    expiresAt: string | null;
  }>): Promise<Poll | null> => {
    if (!session?.user?.id) return null;

    try {
      setError(null);

      const response = await fetch(`/api/polls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      const updated = await response.json();
      setPolls((prev) => prev.map((p) => p.id === id ? updated : p));
      if (currentPoll?.id === id) setCurrentPoll(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar encuesta');
      return null;
    }
  };

  return {
    polls,
    currentPoll,
    isLoading,
    error,
    pagination,
    fetchPolls,
    fetchPoll,
    createPoll,
    vote,
    removeVote,
    deletePoll,
    updatePoll,
  };
}
