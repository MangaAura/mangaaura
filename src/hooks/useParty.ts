/**
 * useParty Hook
 *
 * Hook para gestionar conexión y estado de Party Reading
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import type {
  PartyMember,
  PartyMessage,
  PartyState,
  CursorPosition,
  Reaction,
  PartyServerToClientEvents,
  PartyClientToServerEvents,
} from '@/types/socket';

type PartySocket = Socket<PartyServerToClientEvents, PartyClientToServerEvents>;

interface UsePartyOptions {
  partyId: string;
  autoJoin?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
}

export function useParty(options: UsePartyOptions) {
  const { partyId, autoJoin = true, onConnect, onDisconnect, onError } = options;
  const { data: session, status } = useSession();
  const { handleError } = useErrorHandler();

  const socketRef = useRef<PartySocket | null>(null);
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [party, setParty] = useState<PartyState | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHost, setIsHost] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Conectar socket
  useEffect(() => {
    if (status === 'loading' || !session) return;

    const initSocket = async () => {
      try {
        if (typeof window === 'undefined') return;

        if (!session.user) return;

        const token = session.user.id ?? '';

        const socket: PartySocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
          path: '/api/socket',
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          randomizationFactor: 0.5,
        });

        socketRef.current = socket;
        setSocket(socket);

        // Event listeners de conexion
        socket.on('connect', () => {
          console.info('[Party] Connected');
          setIsConnected(true);
          setError(null);
          onConnect?.();

          // Unirse al party automaticamente
          if (autoJoin) {
            socket.emit('party:join', {
              partyId,
              user: {
                userId: session.user!.id,
                username: session.user!.name || 'Anonymous',
                avatarUrl: session.user!.image || undefined,
              },
            });
          }
        });

        socket.on('disconnect', (reason) => {
          console.info('[Party] Disconnected:', reason);
          setIsConnected(false);
          setIsJoined(false);
          onDisconnect?.(reason);
        });

        socket.on('connect_error', (err) => {
          handleError(err);
          setError(err.message);
          onError?.(err.message);
        });

        // Event listeners de party
        socket.on('party:joined', ({ party: partyData, member }) => {
          console.info('[Party] Joined:', partyData.partyId);
          setIsJoined(true);
          setParty(partyData);
          setMembers(partyData.members);
          setCurrentPage(partyData.currentPage);
          setIsHost(member.isHost);
        });

        socket.on('party:state', (partyData) => {
          setParty(partyData);
          setMembers(partyData.members);
          setCurrentPage(partyData.currentPage);
        });

        socket.on('party:member-joined', ({ member }) => {
          setMembers((prev) => {
            const exists = prev.find((m) => m.userId === member.userId);
            if (exists) {
              return prev.map((m) => (m.userId === member.userId ? member : m));
            }
            return [...prev, member];
          });
        });

        socket.on('party:member-left', ({ userId }) => {
          setMembers((prev) => prev.filter((m) => m.userId !== userId));
        });

        socket.on('party:member-updated', ({ member }) => {
          setMembers((prev) =>
            prev.map((m) => (m.userId === member.userId ? member : m))
          );
        });

        socket.on('party:page-sync', ({ page, hostId }) => {
          setCurrentPage(page);
          // Actualizar pagina del host
          setMembers((prev) =>
            prev.map((m) =>
              m.userId === hostId ? { ...m, currentPage: page } : m
            )
          );
        });

        socket.on('party:message-received', (message) => {
          setMessages((prev) => {
            // Evitar duplicados
            if (prev.find((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        });

        socket.on('party:typing-update', ({ userId, username, isTyping }) => {
          setTypingUsers((prev) => {
            if (isTyping) {
              if (prev.find((u) => u.userId === userId)) return prev;
              return [...prev, { userId, username }];
            } else {
              return prev.filter((u) => u.userId !== userId);
            }
          });
        });

        socket.on('party:cursor-update', ({ userId, position }) => {
          setCursors((prev) => ({
            ...prev,
            [userId]: position,
          }));
        });

        socket.on('party:reaction-received', (reaction) => {
          setReactions((prev) => [...prev, reaction]);
          // Limpiar reacciones despues de 3 segundos
          setTimeout(() => {
            setReactions((prev) =>
              prev.filter((r) => r.id !== reaction.id)
            );
          }, 3000);
        });

        socket.on('party:host-changed', ({ newHostId, newHostName: _newHostName }) => {
          setIsHost(newHostId === session!.user!.id);
          setMembers((prev) =>
            prev.map((m) => ({
              ...m,
              isHost: m.userId === newHostId,
            }))
          );
        });

        socket.on('party:error', ({ message }) => {
          setError(message);
          onError?.(message);
        });

        socket.on('party:closed', ({ reason }) => {
          setError(`Party closed: ${reason}`);
          setIsJoined(false);
        });

        socket.connect();
      } catch (err) {
        handleError(err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session, status, partyId, autoJoin, onConnect, onDisconnect, onError]);

  // Acciones del party
  const joinParty = useCallback(() => {
    if (!socketRef.current || !session) return;
    socketRef.current.emit('party:join', {
      partyId,
      user: {
        userId: session.user!.id,
        username: session.user!.name || 'Anonymous',
        avatarUrl: session.user!.image || undefined,
      },
    });
  }, [partyId, session]);

  const leaveParty = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('party:leave', { partyId });
    setIsJoined(false);
  }, [partyId]);

  const changePage = useCallback(
    (page: number) => {
      if (!socketRef.current || !isHost) return;
      socketRef.current.emit('party:page-change', { partyId, page });
    },
    [partyId, isHost]
  );

  const syncPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (socketRef.current) {
        socketRef.current.emit('party:cursor-move', {
          partyId,
          position: {
            userId: session?.user?.id || '',
            username: session?.user?.name || '',
            x: 0,
            y: 0,
            page,
          },
        });
      }
    },
    [partyId, session]
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !content.trim()) return;
      socketRef.current.emit('party:message', { partyId, content: content.trim() });
    },
    [partyId]
  );

  const sendReaction = useCallback(
    (reaction: string, page: number = currentPage) => {
      if (!socketRef.current) return;
      socketRef.current.emit('party:reaction', { partyId, reaction, page });
    },
    [partyId, currentPage]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current) return;
      socketRef.current.emit('party:typing', { partyId, isTyping });
    },
    [partyId]
  );

  const becomeHost = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('party:become-host', { partyId });
  }, [partyId]);

  const moveCursor = useCallback(
    (x: number, y: number, page: number) => {
      if (!socketRef.current) return;
      socketRef.current.emit('party:cursor-move', {
        partyId,
        position: {
          userId: session?.user?.id || '',
          username: session?.user?.name || '',
          x,
          y,
          page,
        },
      });
    },
    [partyId, session]
  );

  return {
    // Estado
    socket,
    isConnected,
    isJoined,
    party,
    members,
    messages,
    currentPage,
    isHost,
    typingUsers,
    cursors,
    reactions,
    error,

    // Acciones
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
