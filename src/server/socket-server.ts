import { createServer } from 'http';
import { initIO } from '@/lib/socket';

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

process.on('SIGTERM', () => {
  console.info('[Socket.IO] Shutting down...');
  io.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.info('[Socket.IO] Shutting down...');
  io.close(() => process.exit(0));
});
