import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getRedisStatus, isMockRedis } from '@/lib/redis';
import { getIO } from '@/lib/socket';
import { getOnlineClientsCount } from '@/lib/socket-redis-adapter';

export async function GET() {
  const redisStatus = await getRedisStatus();

  // Socket.IO health
  let socketStatus: 'running' | 'not_initialized' | 'error' = 'not_initialized';
  let socketConnections = 0;
  let totalConnections = 0;
  let redisAdapterAvailable = false;

  try {
    const io = getIO();
    if (io) {
      socketStatus = 'running';
      socketConnections = io.sockets.sockets.size;
      // Obtener total de clientes únicos a través de todos los nodos (Redis adapter)
      totalConnections = await getOnlineClientsCount();
      redisAdapterAvailable = !isMockRedis();
    }
  } catch {
    socketStatus = 'error';
  }

  const checks = {
    database: false,
    redis: redisStatus.connected,
    redisMode: redisStatus.mode as 'connected' | 'disconnected' | 'mock',
    socket: socketStatus,
    socketConnections,
    totalConnections,
    redisAdapterAvailable,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: process.env.NODE_ENV,
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const allHealthy = checks.database && (checks.redis || checks.redisMode === 'mock');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      ...checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
