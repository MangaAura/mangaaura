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
import { setRealtimeAnalytics } from '@/lib/analytics-store';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  JoinPartyUser,
  Notification,
  RealtimeAnalytics,
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

  // Mapa de sesiones activas para analiticas en tiempo real
  const activeSessions = new Map<string, {
    userId: string;
    username: string;
    avatarUrl: string | null;
    mangaId?: string;
    chapterId?: string;
    page?: number;
    chapterNumber?: number;
    mangaTitle?: string;
    slug?: string;
    coverUrl?: string | null;
    startedAt: Date;
    lastHeartbeat: Date;
  }>();

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

    // =============== ANALYTICS EVENTS ===============

    socket.on('analytics:heartbeat', (data) => {
      const existing = activeSessions.get(userId);
      if (existing) {
        existing.lastHeartbeat = new Date();
        if (data.mangaId) existing.mangaId = data.mangaId;
        if (data.chapterId) existing.chapterId = data.chapterId;
        if (data.page !== undefined) existing.page = data.page;
      } else {
        activeSessions.set(userId, {
          userId,
          username: username || 'Anonymous',
          avatarUrl: avatarUrl || null,
          mangaId: data.mangaId,
          chapterId: data.chapterId,
          page: data.page,
          startedAt: new Date(),
          lastHeartbeat: new Date(),
        });
      }
    });

    socket.on('analytics:subscribe', () => {
      socket.join('admin:analytics');
    });

    socket.on('analytics:unsubscribe', () => {
      socket.leave('admin:analytics');
    });

    // Desconexion
    (socket.on as (event: string, handler: (...args: any[]) => void) => void)('disconnect', () => {
      console.info(`[Socket] User ${userId} disconnected`);

      activeSessions.delete(userId);

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

  // =============== ANALYTICS BROADCAST INTERVAL ===============

  let peakToday = 0;
  let peakTime = '';
  let lastMinuteReads = 0;
  let lastMinuteCount = 0;
  const ANALYTICS_INTERVAL = 5000;

  const analyticsInterval = setInterval(() => {
    const now = Date.now();
    const activeThreshold = 60_000;
    const staleThreshold = 120_000;

    let activeCount = 0;
    const sessionsList: RealtimeAnalytics['activeSessions'] = [];
    const mangaReaders = new Map<string, { title: string; coverUrl: string | null; slug: string; readers: number }>();

    for (const [sid, session] of activeSessions) {
      const elapsed = now - session.lastHeartbeat.getTime();

      if (elapsed > staleThreshold) {
        activeSessions.delete(sid);
        continue;
      }

      if (elapsed <= activeThreshold) {
        activeCount++;
        sessionsList.push({
          userId: session.userId,
          username: session.username,
          avatarUrl: session.avatarUrl,
          mangaId: session.mangaId,
          mangaTitle: session.mangaTitle,
          chapterNumber: session.chapterNumber,
          currentPage: session.page,
          startedAt: session.startedAt,
          lastHeartbeat: session.lastHeartbeat,
        });

        if (session.mangaId && session.mangaTitle) {
          const existing = mangaReaders.get(session.mangaId);
          if (existing) {
            existing.readers++;
          } else {
            mangaReaders.set(session.mangaId, {
              title: session.mangaTitle,
              coverUrl: session.coverUrl || null,
              slug: session.slug || '',
              readers: 1,
            });
          }
        }
      }
    }

    lastMinuteCount++;
    if (lastMinuteCount >= 12) {
      lastMinuteReads = activeCount;
      lastMinuteCount = 0;
    }

    if (activeCount > peakToday) {
      peakToday = activeCount;
      peakTime = new Date().toLocaleTimeString();
    }

    const readersPerMinute = lastMinuteReads;

    const popularNow = Array.from(mangaReaders.entries())
      .map(([mangaId, data]) => ({ mangaId, ...data }))
      .sort((a, b) => b.readers - a.readers)
      .slice(0, 10);

    const stats: RealtimeAnalytics = {
      activeReaders: activeCount,
      activeReadersChange: 0,
      activeSessions: sessionsList,
      popularNow,
      readersPerMinute,
      peakToday,
      peakTime,
    };

    setRealtimeAnalytics(stats);
    io?.to('admin:analytics').emit('analytics:stats', stats);
  }, ANALYTICS_INTERVAL);

  // Limpiar intervalo al apagar
  (io as any).on('close', () => {
    clearInterval(analyticsInterval);
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
