/**
 * Socket.IO Redis Adapter
 *
 * Adaptador Redis para Socket.IO que permite escalar horizontalmente
 * múltiples instancias del servidor WebSocket.
 */

import { createAdapter } from '@socket.io/redis-adapter';
import { redis, isMockRedis } from '@/lib/redis';
import type { Server as SocketIOServer } from 'socket.io';

export async function createRedisAdapter(io: SocketIOServer): Promise<boolean> {
  if (isMockRedis()) {
    console.info('[Socket] Using in-memory adapter (Redis not available)');
    return false;
  }

  try {
    const pubClient = (redis as any).duplicate?.() || redis;
    const subClient = (redis as any).duplicate?.() || redis;

    if (pubClient !== redis && subClient !== redis) {
      io.adapter(createAdapter(pubClient, subClient));
      console.info('[Socket] Redis adapter enabled for multi-server scaling');
      return true;
    }

    console.info('[Socket] Using fallback in-memory adapter');
    return false;
  } catch (error) {
    console.warn('[Socket] Failed to create Redis adapter:', error);
    return false;
  }
}

export async function getOnlineClientsCount(): Promise<number> {
  if (isMockRedis()) return 0;

  try {
    const keys = await redis.keys('socket.io#*');
    let total = 0;

    for (const key of keys) {
      if (key.includes('#/#')) {
        const count = await redis.scard(key);
        total += count;
      }
    }

    return total;
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