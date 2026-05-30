/**
 * useParty Hook (HTTP Polling)
 *
 * WebSockets fueron removidos. Este hook usa polling HTTP cada 5s
 * para sincronización de página, miembros y mensajes del party.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Tipos ──────────────────────────────────────────────────────────
interface PartyMember {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isHost: boolean;
  isOnline: boolean;
  currentPage: number;
}

interface PartyMessage {
  id: string;
  type: 'chat' | 'system';
  content: string;
  avatarUrl: string | null;
  username: string;
  createdAt: string;
}

interface PartyReaction {
  id: string;
  reaction: string;
  username: string;
}

interface TypingUser {
  username: string;
}

interface UsePartyOptions {
  partyId: string;
  autoJoin?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
}

// ── Hook ───────────────────────────────────────────────────────────
export function useParty({
  partyId,
  autoJoin = false,
  onConnect,
  onError,
}: UsePartyOptions) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [members, setMembers] = useState<PartyMember[]>([]);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const msgPollingRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRef = useRef(false);
  const isHostRef = useRef(isHost);

  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  // ── Join party ──────────────────────────────────────────────────
  const joinParty = useCallback(async () => {
    if (joinedRef.current) return;
    try {
      const res = await fetch(`/api/party/${partyId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.party) {
        const errMsg = data.error || 'Failed to join party';
        setError(errMsg);
        onError?.(errMsg);
        return;
      }
      joinedRef.current = true;
      setIsJoined(true);
      setIsConnected(true);
      onConnect?.();
      setMembers(data.party.members || []);
      setCurrentPage(data.party.currentPage || 1);
      setIsHost(userId === data.party.hostId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to join party';
      setError(errMsg);
      onError?.(errMsg);
    }
  }, [partyId, userId, onConnect, onError]);

  // ── Leave party ─────────────────────────────────────────────────
  const leaveParty = useCallback(async () => {
    try {
      await fetch(`/api/party/${partyId}/leave`, { method: 'POST' });
      joinedRef.current = false;
      setIsJoined(false);
      setIsConnected(false);
    } catch {
      // Best effort
    }
  }, [partyId]);

  // ── Change page (host only) ─────────────────────────────────────
  const changePage = useCallback(async (page: number) => {
    if (!isHost) return;
    setCurrentPage(page);
    try {
      await fetch(`/api/party/${partyId}/page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
    } catch {
      // Optimistic update already applied
    }
  }, [partyId, isHost]);

  // ── Sync page (non-host, for cursor position) ───────────────────
  const syncPage = useCallback(async (page: number) => {
    // No-op: individual page sync not critical enough for HTTP
    void page;
  }, []);

  // ── Send message ────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimistic: PartyMessage = {
      id: optimisticId,
      type: 'chat',
      content,
      avatarUrl: session?.user?.image || null,
      username: session?.user?.name || 'You',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/party/${partyId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'chat' }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...data.message, createdAt: data.message.createdAt?.toString?.() || data.message.createdAt } : m))
        );
      }
    } catch {
      // Keep optimistic message
    }
  }, [partyId, session?.user?.image, session?.user?.name]);

  // ── Send reaction (no-op, no API) ───────────────────────────────
  const sendReaction = useCallback((_reaction: string, _page?: number) => {}, []);

  // ── Set typing (no-op, no API) ──────────────────────────────────
  const setTyping = useCallback((_isTyping: boolean) => {}, []);

  // ── Become host (no-op, no API) ─────────────────────────────────
  const becomeHost = useCallback(() => {}, []);

  // ── Move cursor (no-op, no API) ─────────────────────────────────
  const moveCursor = useCallback((_x: number, _y: number, _page: number) => {}, []);

  // ── Polling: party state (members + currentPage) ────────────────
  useEffect(() => {
    if (!partyId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/party/${partyId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.party) return;

        const party = data.party;
        setMembers(party.members || []);
        // Only update page from server if we're not the host (host controls their own page)
        if (!isHostRef.current) {
          setCurrentPage(party.currentPage || 1);
        }
        setIsConnected(true);
        setError(null);

        setIsHost(userId === party.hostId);
      } catch {
        setIsConnected(false);
      }
    };

    // Initial fetch
    poll();

    pollingRef.current = setInterval(poll, 5000);

    // Pause polling when tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        poll(); // Immediate poll on resume
        if (!pollingRef.current) {
          pollingRef.current = setInterval(poll, 5000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [partyId]);

  // ── Polling: messages ───────────────────────────────────────────
  useEffect(() => {
    if (!partyId || !isJoined) return;

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/party/${partyId}/messages?limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.messages) return;

        setMessages((prev) => {
          const serverIds = new Set(data.messages.map((m: PartyMessage) => m.id));
          const optimisticOnly = prev.filter(
            (m) => m.id.startsWith('temp_') && !serverIds.has(m.id)
          );
          const merged = [...data.messages, ...optimisticOnly];
          merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return merged;
        });
      } catch {
        // Silent, party state polling handles connection status
      }
    };

    // Initial fetch after join
    pollMessages();

    msgPollingRef.current = setInterval(pollMessages, 5000);

    const handleVisibility = () => {
      if (document.hidden) {
        if (msgPollingRef.current) {
          clearInterval(msgPollingRef.current);
          msgPollingRef.current = null;
        }
      } else {
        pollMessages();
        if (!msgPollingRef.current) {
          msgPollingRef.current = setInterval(pollMessages, 5000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (msgPollingRef.current) clearInterval(msgPollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [partyId, isJoined]);

  // ── Auto-join ───────────────────────────────────────────────────
  useEffect(() => {
    if (autoJoin && partyId) {
      queueMicrotask(() => { void joinParty(); });
    }
    return () => {
      if (joinedRef.current) {
        leaveParty();
      }
    };
  }, [autoJoin, partyId, joinParty, leaveParty]);

  return {
    socket: null,
    isConnected,
    isJoined,
    party: null,
    members,
    messages,
    currentPage,
    isHost,
    typingUsers: [] as TypingUser[],
    cursors: {} as Record<string, unknown>,
    reactions: [] as PartyReaction[],
    error,
    joinParty,
    leaveParty,
    changePage,
    syncPage,
    sendMessage,
    sendReaction,
    setTyping,
    becomeHost,
    moveCursor,
  };
}

export default useParty;
