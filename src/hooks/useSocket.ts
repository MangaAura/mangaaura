'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
}

interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  error: string | null;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  emit: <T extends string>(event: T, ...args: unknown[]) => void;
  on: <T extends string>(event: T, callback: (...args: unknown[]) => void) => () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, reconnection = true } = options;
  const { data: session } = useSession();
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect || !session?.user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';

    if (!socketUrl && typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
      return;
    }

    const socket: TypedSocket = io(socketUrl, {
      query: { userId: session.user.id },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [autoConnect, session?.user?.id, reconnection]);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join:room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave:room', room);
  }, []);

  const emit = useCallback(<T extends string>(event: T, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback(<T extends string>(event: T, callback: (...args: unknown[]) => void) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socketRef.current as any)?.on(event, callback);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any)?.off(event, callback);
    };
  }, []);

  /* eslint-disable react-hooks/refs */
  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    emit,
    on,
  };
  /* eslint-enable react-hooks/refs */
}

export default useSocket;
