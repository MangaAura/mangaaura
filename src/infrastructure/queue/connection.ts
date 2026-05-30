/**
 * Shared BullMQ Redis Connection
 *
 * BullMQ recomienda usar una única conexión Redis compartida entre todas
 * las colas y workers para evitar saturar la conexión con el servidor Redis.
 *
 * @see https://docs.bullmq.io/guide/connections
 * @packageDocumentation
 */

import IORedis from 'ioredis';

import { isMockRedis, redis as appRedis } from '@/lib/redis';

let bullConnection: IORedis | null = null;

/**
 * Obtiene la conexión Redis compartida para BullMQ.
 * BullMQ requiere maxRetriesPerRequest: null y enableReadyCheck: false
 * para manejar correctamente la reconexión.
 */
export function getBullConnection(): IORedis {
  if (bullConnection) return bullConnection;

  // En desarrollo sin Redis, usar la conexión mock de la app
  if (isMockRedis()) {
    bullConnection = appRedis as unknown as IORedis;
    return bullConnection;
  }

  const REDIS_URL = process.env.REDIS_URL;

  // Si hay REDIS_URL, crear conexión ioredis optimizada para BullMQ
  if (REDIS_URL) {
    bullConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,    // BullMQ handles ready checks
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
    });

    bullConnection.on('error', (error) => {
      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_REDIS) {
        console.error('[BullMQ Connection] Redis error:', error.message);
      }
    });
  } else {
    // Fallback: usar la conexión de la app (puede ser mock)
    bullConnection = appRedis as unknown as IORedis;
  }

  return bullConnection;
}

/**
 * Cierra la conexión compartida de BullMQ.
 * Llamar durante el shutdown de la aplicación.
 */
export async function closeBullConnection(): Promise<void> {
  if (bullConnection && !isMockRedis()) {
    try {
      await bullConnection.quit();
    } catch (error) {
      console.error('[BullMQ Connection] Error closing connection:', error);
    }
    bullConnection = null;
  }
}
