/**
 * Socket.io Server for Party Mode
 * Servidor WebSocket independiente para sincronización en tiempo real
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.SOCKET_PORT || 3001;
const CORS_ORIGIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Crear servidor HTTP
const httpServer = createServer();

// Configurar Socket.io
const io = new SocketIOServer(httpServer, {
  path: '/api/socket',
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Almacenamiento de salas en memoria
interface PartyRoom {
  id: string;
  chapterId: string;
  hostId: string;
  hostName: string;
  isPublic: boolean;
  maxUsers: number;
  currentUsers: number;
  currentPage: number;
  users: Map<string, { username: string; socketId: string }>;
  createdAt: Date;
  status: 'active' | 'ended';
}

const partyRooms = new Map<string, PartyRoom>();

// Eventos de conexión
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  // Unirse a una sala de lectura
  socket.on('join-party', (data: { partyId: string; userId: string; username: string }) => {
    const { partyId, userId, username } = data;
    
    // Crear sala si no existe
    if (!partyRooms.has(partyId)) {
      partyRooms.set(partyId, {
        id: partyId,
        chapterId: 'unknown',
        hostId: userId,
        hostName: username,
        isPublic: true,
        maxUsers: 10,
        currentUsers: 0,
        currentPage: 1,
        users: new Map(),
        createdAt: new Date(),
        status: 'active',
      });
    }

    const room = partyRooms.get(partyId)!;
    
    // Verificar capacidad
    if (room.currentUsers >= room.maxUsers) {
      socket.emit('error', { message: 'Sala llena' });
      return;
    }

    // Unirse a la sala
    socket.join(partyId);
    room.users.set(userId, { username, socketId: socket.id });
    room.currentUsers = room.users.size;

    console.log(`[Socket] ${username} joined party: ${partyId}`);

    // Notificar al usuario que se unió
    socket.emit('joined-party', {
      partyId,
      currentPage: room.currentPage,
      users: Array.from(room.users.entries()).map(([id, user]) => ({
        userId: id,
        username: user.username,
      })),
    });

    // Notificar a otros usuarios
    socket.to(partyId).emit('user-joined', {
      userId,
      username,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Enviar mensaje de sistema
    io.to(partyId).emit('new-message', {
      id: Date.now().toString(),
      userId: 'system',
      username: 'Sistema',
      text: `${username} se unió a la sala`,
      timestamp: new Date().toISOString(),
      type: 'system',
    });
  });

  // Sincronización de página
  socket.on('page-change', (data: { partyId: string; page: number; userId: string }) => {
    const room = partyRooms.get(data.partyId);
    if (room) {
      room.currentPage = data.page;
      socket.to(data.partyId).emit('page-updated', {
        page: data.page,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Enviar mensaje de chat
  socket.on('send-message', (data: { 
    partyId: string; 
    message: string; 
    userId: string; 
    username: string; 
    avatar?: string;
  }) => {
    const messageData = {
      id: Date.now().toString(),
      userId: data.userId,
      username: data.username,
      avatar: data.avatar,
      text: data.message,
      timestamp: new Date().toISOString(),
      type: 'user' as const,
    };

    // Broadcast a todos en la sala (incluyendo el emisor)
    io.to(data.partyId).emit('new-message', messageData);
  });

  // Indicador de "está escribiendo"
  socket.on('typing', (data: { 
    partyId: string; 
    userId: string; 
    username: string; 
    isTyping: boolean;
  }) => {
    socket.to(data.partyId).emit('user-typing', data);
  });

  // Reacción a panel/manga
  socket.on('reaction', (data: { 
    partyId: string; 
    reaction: string; 
    userId: string; 
    username: string;
  }) => {
    socket.to(data.partyId).emit('user-reaction', {
      reaction: data.reaction,
      username: data.username,
      timestamp: new Date().toISOString(),
    });
  });

  // Salir de la sala
  socket.on('leave-party', (data: { partyId: string; userId: string }) => {
    const room = partyRooms.get(data.partyId);
    if (room) {
      const user = room.users.get(data.userId);
      if (user) {
        room.users.delete(data.userId);
        room.currentUsers = room.users.size;
        
        socket.leave(data.partyId);
        
        // Notificar a otros usuarios
        socket.to(data.partyId).emit('user-left', {
          userId: data.userId,
          username: user.username,
          timestamp: new Date().toISOString(),
        });

        // Mensaje de sistema
        io.to(data.partyId).emit('new-message', {
          id: Date.now().toString(),
          userId: 'system',
          username: 'Sistema',
          text: `${user.username} salió de la sala`,
          timestamp: new Date().toISOString(),
          type: 'system',
        });

        // Limpiar sala si está vacía
        if (room.users.size === 0) {
          partyRooms.delete(data.partyId);
          console.log(`[Socket] Party ${data.partyId} deleted (empty)`);
        }
      }
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    
    // Buscar y limpiar salas
    for (const [partyId, room] of partyRooms.entries()) {
      for (const [userId, user] of room.users.entries()) {
        if (user.socketId === socket.id) {
          room.users.delete(userId);
          room.currentUsers = room.users.size;
          
          // Notificar a otros usuarios
          socket.to(partyId).emit('user-left', {
            userId,
            username: user.username,
            timestamp: new Date().toISOString(),
          });

          // Limpiar sala si está vacía
          if (room.users.size === 0) {
            partyRooms.delete(partyId);
            console.log(`[Socket] Party ${partyId} deleted (empty)`);
          }
          break;
        }
      }
    }
  });
});

// Endpoint HTTP para verificar estado
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connections: io.engine.clientsCount,
      rooms: partyRooms.size,
    }));
  }
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`[Socket] Server running on port ${PORT}`);
  console.log(`[Socket] CORS origin: ${CORS_ORIGIN}`);
});

// Manejar señales de cierre
process.on('SIGTERM', () => {
  console.log('[Socket] SIGTERM received, shutting down gracefully');
  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[Socket] SIGINT received, shutting down gracefully');
  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
});
