/**
 * Socket.IO API Route
 * 
 * Endpoint de estado para el servidor Socket.IO con métricas
 * de escalabilidad horizontal vía Redis adapter.
 */

import { NextResponse } from 'next/server';

import { isMockRedis } from '@/lib/redis';
import { getIO } from '@/lib/socket';
import { getOnlineClientsCount, getRoomClientsCount } from '@/lib/socket-redis-adapter';

export async function GET() {
  try {
    const io = getIO();
    
    if (!io) {
      return NextResponse.json(
        { error: 'Socket.IO not initialized', status: 'offline' },
        { status: 503 }
      );
    }

    const [totalClients, partyRoomCount] = await Promise.all([
      getOnlineClientsCount(),
      getRoomClientsCount('party'),
    ]);

    const localClients = io.sockets.sockets.size;
    const redisAvailable = !isMockRedis();

    return NextResponse.json({ 
      success: true,
      status: 'running',
      adapter: redisAvailable ? 'redis' : 'in_memory',
      connections: {
        local: localClients,
        total: totalClients || localClients,
      },
      rooms: {
        party: partyRoomCount,
      },
      transports: ['websocket', 'polling'],
    });
  } catch (error) {
    console.error('[Socket API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', status: 'error' },
      { status: 500 }
    );
  }
}

// El servidor Socket.IO real corre independientemente vía custom server o socket-server.ts
export async function POST() {
  return NextResponse.json({ 
    message: 'Socket.IO server runs independently. Use GET for status.' 
  });
}
