/**
 * Shared BullMQ Redis Connection
 *
 * BullMQ recomienda usar una única conexión Redis compartida entre todas
 * las colas y workers para evitar saturar la conexión con el servidor Redis.
 *
 * Incluye monitoreo de salud de conexión para el circuit breaker.
 *
 * @see https://docs.bullmq.io/guide/connections
 * @packageDocumentation
 */

import IORedis from 'ioredis';

import { isMockRedis, redis as appRedis } from '@/lib/redis';
import { getRedisCircuitBreaker } from '@/lib/circuit-breaker';

let bullConnection: IORedis | null = null;
let connectionHealthy = false;
let lastConnectionError: string | null = null;
let lastHealthCheckTime = 0;
let connectionAttempts = 0;
let connectionId: string | null = null;

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
    connectionHealthy = true;
    connectionId = 'mock';
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

    connectionAttempts++;
    connectionId = `ioredis-${connectionAttempts}`;

    bullConnection.on('connect', () => {
      connectionHealthy = true;
      lastConnectionError = null;
      const breaker = getRedisCircuitBreaker();
      if (breaker.getState() !== 'CLOSED') {
        breaker.recover();
        console.info('[BullMQ Connection] Redis reconnected — circuit breaker reset');
      }
    });

    bullConnection.on('ready', () => {
      connectionHealthy = true;
    });

    bullConnection.on('error', (error) => {
      connectionHealthy = false;
      lastConnectionError = error.message;

      const breaker = getRedisCircuitBreaker();
      breaker.recordFailure(error);

      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_REDIS) {
        console.error('[BullMQ Connection] Redis error:', error.message);
      }
    });

    bullConnection.on('close', () => {
      connectionHealthy = false;
      lastConnectionError = 'Connection closed';
    });

    bullConnection.on('reconnecting', () => {
      if (process.env.DEBUG_REDIS) {
        console.log('[BullMQ Connection] Reconnecting...');
      }
    });
  } else {
    // Fallback: usar la conexión de la app (puede ser mock)
    bullConnection = appRedis as unknown as IORedis;
    connectionHealthy = true; // Mock connections are always healthy
    connectionId = 'app-fallback';
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
  connectionHealthy = false;
  connectionId = null;
}

/**
 * Obtiene métricas de salud de la conexión Redis
 */
export function getConnectionMetrics(): {
  healthy: boolean;
  lastError: string | null;
  lastHealthCheckTime: number;
  connectionId: string | null;
  isMock: boolean;
} {
  return {
    healthy: connectionHealthy,
    lastError: lastConnectionError,
    lastHealthCheckTime,
    connectionId,
    isMock: isMockRedis(),
  };
}

/**
 * Health check manual de la conexión Redis.
 * Retorna true si la conexión responde.
 */
export async function checkRedisHealth(): Promise<boolean> {
  lastHealthCheckTime = Date.now();

  if (isMockRedis()) return true;

  try {
    const conn = getBullConnection();
    if (!conn) {
      connectionHealthy = false;
      return false;
    }

    // En mock mode, siempre responde
    if ((conn as any).constructor?.name === 'MockRedis') {
      connectionHealthy = true;
      return true;
    }

    // Ping real
    await conn.ping();
    connectionHealthy = true;
    return true;
  } catch (error) {
    connectionHealthy = false;
    lastConnectionError = error instanceof Error ? error.message : 'Unknown error';
    return false;
  }
}
