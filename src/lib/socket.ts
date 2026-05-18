/**
 * Socket.IO Server Configuration
 *
 * WebSocket para notificaciones en tiempo real y Party Reading.
 */

import { Server as NetServer } from 'http';
import { getToken } from 'next-auth/jwt';
import { Server as SocketIOServer } from 'socket.io';

import { partyService } from '@/core/services/PartyService';
import { sanitizeText } from '@/lib/sanitize';
import { createRedisAdapter } from '@/lib/socket-redis-adapter';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  JoinPartyUser,
  Notification,
} from '@/types/socket';

// Re-exportar tipos para compatibilidad
export * from '@/types/socket';

// Singleton para el servidor Socket.IO
export type IOServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: IOServer | null = null;

export const getIO = (): IOServer | null => io;

export const initIO = (httpServer: NetServer): IOServer => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Inicializar adaptador Redis para escalabilidad multi-servidor
  createRedisAdapter(io).then((enabled) => {
    if (enabled) {
      console.info('[Socket] Redis adapter initialized');
    }
  }).catch((error) => {
    console.warn('[Socket] Redis adapter init failed (non-blocking):', error.message);
  });

  // Middleware de autenticacion
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verificar token con next-auth
      const decoded = await getToken({
        req: { headers: { cookie: `next-auth.session-token=${token}` } },
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!decoded?.sub) {
        return next(new Error('Invalid token'));
      }

      socket.data.userId = decoded.sub;
      socket.data.username = decoded.name as string;
      socket.data.avatarUrl = decoded.image as string | undefined;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Eventos de conexion
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    const avatarUrl = socket.data.avatarUrl;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.info(`[Socket] User ${userId} connected`);

    // Unirse a room personal
    socket.join(`user:${userId}`);

    // =============== PARTY EVENTS ===============

    // Unirse a party
    socket.on('party:join', ({ partyId, user }) => {
      const userData: JoinPartyUser = user || {
        userId,
        username: username || 'Anonymous',
        avatarUrl,
      };

      const result = partyService.joinParty(partyId, userData, socket.id);

      if (!result.success || !result.member) {
        socket.emit('party:error', { message: result.error || 'Failed to join party' });
        return;
      }

      const party = partyService.getParty(partyId);
      if (!party) {
        socket.emit('party:error', { message: 'Party not found' });
        return;
      }

      // Unirse al room del party
      socket.join(`party:${partyId}`);

      // Notificar al usuario que se unio
      socket.emit('party:joined', { party, member: result.member });

      // Notificar a otros miembros
      socket.to(`party:${partyId}`).emit('party:member-joined', { member: result.member });

      // Enviar estado actual del party
      socket.emit('party:state', party);

      // Mensaje de sistema
      const systemMessage = partyService.addMessage(
        partyId,
        'system',
        'System',
        `${userData.username} joined the party`,
        'system'
      );

      if (systemMessage) {
        io?.to(`party:${partyId}`).emit('party:message-received', systemMessage);
      }

      console.info(`[Socket] User ${userId} joined party ${partyId}`);
    });

    // Salir del party
    socket.on('party:leave', ({ partyId }) => {
      const result = partyService.leaveParty(partyId, userId);

      if (result.success) {
        socket.leave(`party:${partyId}`);

        // Notificar a otros miembros
        socket.to(`party:${partyId}`).emit('party:member-left', { userId });

        // Mensaje de sistema
        const systemMessage = partyService.addMessage(
          partyId,
          'system',
          'System',
          `${username || 'A user'} left the party`,
          'system'
        );

        if (systemMessage) {
          io?.to(`party:${partyId}`).emit('party:message-received', systemMessage);
        }

        // Si era host, notificar cambio de host
        if (result.wasHost) {
          const party = partyService.getParty(partyId);
          if (party) {
            const newHost = party.members.find((m) => m.isHost);
            if (newHost) {
              io?.to(`party:${partyId}`).emit('party:host-changed', {
                newHostId: newHost.userId,
                newHostName: newHost.username,
              });
            }
          }
        }
      }

      console.info(`[Socket] User ${userId} left party ${partyId}`);
    });

    // Cambiar pagina (solo host)
    socket.on('party:page-change', ({ partyId, page }) => {
      const result = partyService.updatePage(partyId, userId, page);

      if (result.success) {
        // Notificar a todos los miembros
        io?.to(`party:${partyId}`).emit('party:page-sync', {
          page,
          hostId: userId,
        });

        // Mensaje de sistema
        const systemMessage = partyService.addMessage(
          partyId,
          'system',
          'System',
          `${username || 'Host'} changed to page ${page}`,
          'system'
        );

        if (systemMessage) {
          io?.to(`party:${partyId}`).emit('party:message-received', systemMessage);
        }
      } else {
        socket.emit('party:error', { message: result.error || 'Failed to change page' });
      }
    });

    // Movimiento del cursor
    socket.on('party:cursor-move', ({ partyId, position }) => {
      const party = partyService.getParty(partyId);
      if (!party) return;

      // Broadcast a otros miembros
      socket.to(`party:${partyId}`).emit('party:cursor-update', {
        userId,
        position: {
          ...position,
          userId,
          username: username || 'Anonymous',
        },
      });
    });

    // Enviar reaccion
    socket.on('party:reaction', ({ partyId, reaction, page }) => {
      const party = partyService.getParty(partyId);
      if (!party) return;

      const reactionData = {
        id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        username: username || 'Anonymous',
        reaction,
        page,
        createdAt: new Date(),
      };

      // Broadcast a todos los miembros
      io?.to(`party:${partyId}`).emit('party:reaction-received', reactionData);

      // Mensaje de sistema para reaccion
      const systemMessage = partyService.addMessage(
        partyId,
        'system',
        'System',
        `${username || 'Someone'} reacted with ${reaction}`,
        'system'
      );

      if (systemMessage) {
        io?.to(`party:${partyId}`).emit('party:message-received', systemMessage);
      }
    });

    // Enviar mensaje de chat
    socket.on('party:message', ({ partyId, content }) => {
      if (!content.trim()) return;

      const sanitized = sanitizeText(content);
      if (!sanitized) return;

      const message = partyService.addMessage(
        partyId,
        userId,
        username || 'Anonymous',
        sanitized,
        'chat',
        avatarUrl
      );

      if (message) {
        io?.to(`party:${partyId}`).emit('party:message-received', message);
      }
    });

    // Indicador de escritura
    socket.on('party:typing', ({ partyId, isTyping }) => {
      socket.to(`party:${partyId}`).emit('party:typing-update', {
        userId,
        username: username || 'Anonymous',
        isTyping,
      });
    });

    // Ser anfitrion
    socket.on('party:become-host', ({ partyId }) => {
      const party = partyService.getParty(partyId);
      if (!party) return;

      // Solo el host actual puede transferir, o si no hay host
      if (party.hostId && party.hostId !== userId) {
        // Verificar si el host esta activo
        const currentHost = party.members.find((m) => m.isHost);
        if (currentHost?.isOnline) {
          socket.emit('party:error', { message: 'Current host is still active' });
          return;
        }
      }

      const success = partyService.transferHost(partyId, party.hostId, userId);

      if (success) {
        io?.to(`party:${partyId}`).emit('party:host-changed', {
          newHostId: userId,
          newHostName: username || 'Anonymous',
        });

        // Mensaje de sistema
        const systemMessage = partyService.addMessage(
          partyId,
          'system',
          'System',
          `${username || 'A user'} is now the host`,
          'system'
        );

        if (systemMessage) {
          io?.to(`party:${partyId}`).emit('party:message-received', systemMessage);
        }
      }
    });

    // =============== NOTIFICATION EVENTS ===============

    // Unirse a rooms de mangas seguidos
    socket.on('user:join-room', (room) => {
      socket.join(room);
      console.info(`[Socket] User ${userId} joined room ${room}`);
    });

    // Salir de rooms
    socket.on('user:leave-room', (room) => {
      socket.leave(room);
      console.info(`[Socket] User ${userId} left room ${room}`);
    });

    // Marcar notificacion como leida
    socket.on('notification:mark-read', (notificationId) => {
      io?.to(`user:${userId}`).emit('notification:read', notificationId);
    });

    // Marcar todas como leidas
    socket.on('notification:mark-all-read', () => {
      io?.to(`user:${userId}`).emit('notification:count', 0);
    });

    // Ping-pong para mantener conexion
  socket.on('ping', () => {
    socket.emit('notification:new', { notification: null } as any);
  });

    // Desconexion
    (socket.on as (event: string, handler: (...args: any[]) => void) => void)('disconnect', () => {
      console.info(`[Socket] User ${userId} disconnected`);

      // Desconectar de todos los parties
      const userParty = partyService.getUserParty(userId);
      if (userParty) {
        partyService.disconnectUser(userParty.partyId, userId);

        // Notificar a otros miembros
        socket.to(`party:${userParty.partyId}`).emit('party:member-updated', {
          member: {
            ...userParty.members.find((m) => m.userId === userId)!,
            isOnline: false,
          },
        });
      }
    });
  });

  return io;
};

// Helper para emitir notificaciones
export const emitNotification = (
  userId: string,
  notification: unknown
) => {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification as Notification);
  }
};

// Helper para emitir a múltiples usuarios
export const emitToRoom = (
  room: string,
  event: keyof ServerToClientEvents & string,
  data: any
) => {
  const io = getIO();
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Helper para broadcast
export const broadcastNotification = (
  event: keyof ServerToClientEvents & string,
  data: any
) => {
  const io = getIO();
  if (io) {
    io.emit(event, data);
  }
};
