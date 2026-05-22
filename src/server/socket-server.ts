import { createServer } from 'http';

import { initIO } from '@/lib/socket';
import { closeRedisConnection } from '@/lib/redis';

const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO server running');
});

const io = initIO(httpServer);

httpServer.listen(PORT, () => {
  console.info(`[Socket.IO] Server listening on port ${PORT}`);
  console.info(`[Socket.IO] Path: /api/socket`);
  console.info(`[Socket.IO] Transports: websocket, polling`);
});

// Graceful shutdown con limpieza de Redis adapter
// Nota: io.close() ya cierra el HTTP server subyacente
const gracefulShutdown = async (signal: string) => {
  console.info(`[Socket.IO] Received ${signal}, shutting down...`);

  // 1. Cerrar Socket.IO (desconecta clients, cierra adapter y HTTP server)
  await new Promise<void>((resolve) => {
    io.close(() => {
      console.info('[Socket.IO] Server closed');
      resolve();
    });
  });

  // 2. Cerrar conexiones Redis (pub/sub clients del adapter)
  try {
    await closeRedisConnection();
    console.info('[Socket.IO] Redis connections closed');
  } catch (err) {
    console.error('[Socket.IO] Error closing Redis:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
