/**
 * useSocket Hook
 * 
 * Hook para conectar al servidor Socket.IO
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/lib/socket';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session, status } = useSession();
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');
  const [error, setError] = useState<string | null>(null);
  
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  useEffect(() => {
    if (status === 'loading' || !session) return;

    const initSocket = async () => {
      try {
        // Solo inicializar en cliente
        if (typeof window === 'undefined') return;

        // Obtener token de sesión
        const token = session.user?.id; // Simplificado, idealmente usar JWT

        // Crear conexión Socket.IO
        const socket: SocketType = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
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

        // Event listeners
        socket.on('connect', () => {
          console.log('[Socket] Connected');
          setIsConnected(true);
          setTransport(socket.io.engine?.transport?.name || 'N/A');
          setError(null);
          onConnect?.();
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
          setIsConnected(false);
          onDisconnect?.(reason);
        });

        socket.on('connect_error', (err) => {
          console.error('[Socket] Connection error:', err);
          setError(err.message);
          onError?.(err);
        });

    socket.io.engine.on('upgrade', (transport) => {
      const name = typeof transport === 'string' ? transport : transport.name;
      console.log('[Socket] Transport upgraded to:', name);
      setTransport(name);
    });

        // Auto connect
        if (autoConnect) {
          socket.connect();
        }
      } catch (err) {
        console.error('[Socket] Init error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [session, status, autoConnect, onConnect, onDisconnect, onError]);

  // Métodos expuestos
  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('user:join-room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('user:leave-room', room);
  }, []);

  const emit = useCallback(<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback(<T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ) => {
    socketRef.current?.on(event, callback as any);
    return () => {
      socketRef.current?.off(event, callback as any);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    transport,
    error,
    joinRoom,
    leaveRoom,
    emit,
    on,
  };
}

export default useSocket;
