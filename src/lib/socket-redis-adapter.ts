/**
 * Socket.IO Redis Adapter
 *
 * Adaptador Redis para Socket.IO que permite escalar horizontalmente
 * múltiples instancias del servidor WebSocket.
 */

import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server as SocketIOServer } from 'socket.io';

import { redis, isMockRedis } from '@/lib/redis';

export async function createRedisAdapter(io: SocketIOServer): Promise<boolean> {
  if (isMockRedis()) {
    console.info('[Socket] Using in-memory adapter (Redis not available)');
    return false;
  }

  const realRedis = redis as Redis;

  // Ensure the main Redis client is connected before duplicating
  try {
    if (realRedis.status === 'wait') {
      await realRedis.connect();
    }
  } catch (connErr) {
    console.warn('[Socket] Redis not reachable, using in-memory adapter');
    return false;
  }

  try {
    const pubClient = realRedis.duplicate();
    const subClient = realRedis.duplicate();

    // Suppress errors on duplicated clients to prevent crashes
    const onError = (role: string) => (err: Error) => {
      console.warn(`[Socket] Redis ${role} error:`, err.message);
    };
    pubClient.on('error', onError('pubClient'));
    subClient.on('error', onError('subClient'));

    // Connect duplicated clients before passing to adapter
    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.info('[Socket] Redis adapter enabled for multi-server scaling');
    return true;
  } catch (error) {
    console.warn('[Socket] Failed to create Redis adapter, using in-memory fallback:', error instanceof Error ? error.message : error);
    return false;
  }
}

// NOTE: Usa KEYS en vez de SCAN por simplicidad. En producción con muchas
// rooms (>1000), considera migrar a redis.scan() con cursor para no bloquear Redis.
export async function getOnlineClientsCount(): Promise<number> {
  if (isMockRedis()) return 0;

  try {
    const keys = await redis.keys('socket.io#*');
    const uniqueSockets = new Set<string>();

    for (const key of keys) {
      // Solo contar rooms del namespace por defecto ("/")
      if (key.includes('#/#')) {
        const members = await redis.smembers(key);
        for (const member of members) {
          uniqueSockets.add(member);
        }
      }
    }

    return uniqueSockets.size;
  } catch {
    return 0;
  }
}

export async function getRoomClientsCount(room: string): Promise<number> {
  if (isMockRedis()) return 0;

  try {
    const keys = await redis.keys('socket.io#*#' + room + '#');
    let total = 0;

    for (const key of keys) {
      const count = await redis.scard(key);
      total += count;
    }

    return total;
  } catch {
    return 0;
  }
}

export { createAdapter };