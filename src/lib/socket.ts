import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { Server as IOServer } from 'socket.io';

import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '@/types/socket';

interface SocketServer extends HTTPServer {
  io?: IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

let io: IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export function initIO(httpServer?: HTTPServer) {
  if (io) return io;

  if (!httpServer) {
    console.warn('[Socket] No HTTP server provided — running in HTTP-only mode');
    return null;
  }

  io = new IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('join:room', (room) => {
      socket.join(room as string);
    });

    socket.on('leave:room', (room) => {
      socket.leave(room as string);
    });

    socket.on('disconnect', () => {});
  });

  console.info('[Socket] IO server initialized');
  return io;
}

export function getIO() {
  return io;
}

export function emitNotification(userId: string, notification: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

export function emitToRoom(room: string, event: string, data: unknown) {
  if (!io) return;
  io.to(room).emit(event, data);
}

export function broadcastNotification(event: string, data: unknown) {
  if (!io) return;
  io.emit(event, data);
}

export type { SocketServer, SocketWithIO };
export type { IOServer };
