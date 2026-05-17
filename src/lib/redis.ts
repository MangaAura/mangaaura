import { Redis } from 'ioredis';

// ============================================================================
// Redis Configuration with Graceful Fallback
// ============================================================================

const REDIS_URL = process.env.REDIS_URL;
const isDevelopment = process.env.NODE_ENV !== 'production';
// Suppress ioredis unhandled error warnings globally in development
// Guard: only run in Node.js runtime (not Edge or browser)
if (isDevelopment && typeof globalThis.process !== 'undefined' && typeof (globalThis.process as any).emit === 'function') {
  try {
    const nodeProcess = globalThis.process as any;
    const originalEmit = nodeProcess.emit;
    nodeProcess.emit = function (event: string | symbol, ...args: unknown[]): boolean {
      if (event === 'warning' && args[0] instanceof Error) {
        const warning = args[0] as Error;
        if (warning.message?.includes('ioredis') || warning.message?.includes('Unhandled error event')) {
          return false;
        }
      }
      return originalEmit.call(this, event, ...args);
    };
  } catch {
    // Silently fail if process.emit manipulation is not allowed
  }
}

// Track if Redis is available
let redisAvailable = false;
let redisInstance: Redis | null = null;
let mockRedisInstance: MockRedis | null = null;

// Global reference for hot reload (defined early for use in getRedisInstance)
const globalForRedis = global as unknown as {
  redis?: Redis;
  mockRedis?: MockRedis;
};

// ============================================================================
// Mock Redis Implementation (for development without Redis)
// ============================================================================

class MockRedis {
  private store = new Map<string, { value: string; expiry?: number }>();
  private sortedSets = new Map<string, { score: number; member: string }[]>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + seconds * 1000,
    });
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
    }
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, []);
    }
    const set = this.sortedSets.get(key)!;
    const existing = set.findIndex(item => item.member === member);
    if (existing >= 0) {
      set[existing].score = score;
      return 0;
    }
    set.push({ score, member });
    return 1;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    const before = set.length;
    const filtered = set.filter(item => item.score < min || item.score > max);
    this.sortedSets.set(key, filtered);
    return before - filtered.length;
  }

  async zcard(key: string): Promise<number> {
    return this.sortedSets.get(key)?.length ?? 0;
  }

  async scard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    if (set) return set.length;
    const item = this.store.get(key);
    if (!item) return 0;
    try {
      const arr = JSON.parse(item.value);
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  }

  async zrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const sorted = [...set].sort((a, b) => a.score - b.score);
    const end = stop < 0 ? sorted.length + stop + 1 : stop + 1;
    const slice = sorted.slice(start, end);
    if (withScores === 'WITHSCORES') {
      const result: string[] = [];
      for (const item of slice) {
        result.push(item.member);
        result.push(String(item.score));
      }
      return result;
    }
    return slice.map(item => item.member);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.sortedSets.has(key)) {
      setTimeout(() => { this.sortedSets.delete(key); }, seconds * 1000);
      return 1;
    }
    const item = this.store.get(key);
    if (item) {
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || (item.expiry && item.expiry < Date.now())) {
      this.store.delete(key);
      this.store.set(key, { value: '1' });
      return 1;
    }
    const current = parseInt(item.value, 10) || 0;
    const next = current + 1;
    item.value = String(next);
    return next;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiry) return -1;
    const remaining = Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
    return remaining;
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  // Event emitter compatible methods (no-op)
  on(_event: string, _listener: (...args: unknown[]) => void): this {
    return this;
  }

  once(_event: string, _listener: (...args: unknown[]) => void): this {
    return this;
  }

  off(_event: string, _listener: (...args: unknown[]) => void): this {
    return this;
  }

  emit(_event: string, ..._args: unknown[]): boolean {
    return true;
  }
}

// ============================================================================
// Redis Connection Factory
// ============================================================================

function createRealRedis(): Redis {
  const client = new Redis(REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
    enableOfflineQueue: false, // Don't queue commands when offline
    // Suppress connection errors in development
    showFriendlyErrorStack: isDevelopment,
  });

  // Suppress all error output in development
  const silentError = () => {};

  // Handle connection events silently in dev, with logging in production
  client.on('connect', () => {
    redisAvailable = true;
    if (!isDevelopment) {
      console.log('[Redis] Connected successfully');
    }
  });

  client.on('ready', () => {
    redisAvailable = true;
  });

  // Primary error handler - silently swallow errors in development
  client.on('error', (error: Error & { code?: string }) => {
    redisAvailable = false;
    // Completely suppress connection errors in development
    if (isDevelopment) {
      return;
    }
    // Only log in production if DEBUG_REDIS is set
    if (process.env.DEBUG_REDIS) {
      console.error('[Redis] Connection error:', error.message);
    }
  });

  // Additional error event handlers to prevent unhandled warnings
  client.on('close', () => {
    redisAvailable = false;
    if (!isDevelopment && process.env.DEBUG_REDIS) {
      console.log('[Redis] Connection closed');
    }
  });

  client.on('reconnecting', () => {
    if (!isDevelopment && process.env.DEBUG_REDIS) {
      console.log('[Redis] Reconnecting...');
    }
  });

  client.on('end', silentError);
  client.on('wait', silentError);

  // Catch-all for any other events that might emit errors
  client.on('node error', silentError);

  return client;
}

function getRedisInstance(): Redis | MockRedis {
  // Clear any cached real Redis instance in development without REDIS_URL
  if (isDevelopment && !process.env.REDIS_URL && redisInstance) {
    redisInstance.disconnect?.();
    redisInstance = null;
    globalForRedis.redis = undefined;
  }

  if (mockRedisInstance) return mockRedisInstance;
  if (redisInstance) return redisInstance;

  // In development, default to mock Redis unless explicitly configured
  if (isDevelopment && !process.env.REDIS_URL) {
    mockRedisInstance = new MockRedis();
    if (process.env.DEBUG_REDIS) {
      console.log('[Redis] Using MockRedis for development');
    }
    return mockRedisInstance;
  }

  // Try to create real Redis connection
  try {
    redisInstance = createRealRedis();
    return redisInstance;
  } catch (error) {
    // Fallback to mock if creation fails
    mockRedisInstance = new MockRedis();
    if (!isDevelopment) {
      console.warn('[Redis] Failed to create Redis client, using mock fallback');
    }
    return mockRedisInstance;
  }
}

// ============================================================================
// Exported Redis Client (singleton)
// ============================================================================

export const redis =
  globalForRedis.redis ||
  globalForRedis.mockRedis ||
  getRedisInstance();

// Store in global for hot reload in development
if (isDevelopment) {
  if (redis instanceof Redis) {
    globalForRedis.redis = redis as Redis;
  } else {
    globalForRedis.mockRedis = redis as MockRedis;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return redisAvailable;
}

/**
 * Check if using mock Redis (development fallback)
 */
export function isMockRedis(): boolean {
  return redis instanceof MockRedis;
}

/**
 * Get Redis connection status for health checks
 */
export async function getRedisStatus(): Promise<{
  connected: boolean;
  isMock: boolean;
  mode: string;
}> {
  return {
    connected: redisAvailable,
    isMock: isMockRedis(),
    mode: isMockRedis() ? 'mock' : redisAvailable ? 'connected' : 'disconnected',
  };
}

// ============================================================================
// Cleanup Function for Graceful Shutdown
// ============================================================================

export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
  if (mockRedisInstance) {
    await mockRedisInstance.quit();
    mockRedisInstance = null;
  }
  redisAvailable = false;
}
