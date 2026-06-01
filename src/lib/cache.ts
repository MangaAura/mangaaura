/**
 * Cache utilities with memory-first strategy and Redis fallback.
 *
 * ✅ Memory-only operations (invalidation, key generation) are in memory-cache.ts
 *    so Client Components can import them without pulling in ioredis.
 * ✅ Redis is loaded lazily (dynamic import) so server-only modules are never
 *    bundled into the client.
 */

import {
  cleanupMemoryCache,
  memoryCache,
} from './memory-cache';

export {
  CACHE_PREFIXES,
  generateCacheKey,
  invalidateChapterCache,
  invalidateMangaCache,
  invalidatePattern,
  invalidateUserCache,
} from './memory-cache';

// ─── Lazy Redis loader (never evaluated on the client) ───────────────

type RedisClient = any;

let _redisClient: RedisClient | null | undefined = undefined;

async function ensureRedis(): Promise<RedisClient | null> {
  if (_redisClient !== undefined) return _redisClient;

  try {
    const mod = await import('./redis');
    _redisClient = mod.redis;
  } catch {
    _redisClient = null;
  }

  return _redisClient;
}

// Default TTL values (in seconds)
const DEFAULT_TTL = 3600; // 1 hour

/**
 * Get data from cache (memory first, then Redis)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  // 1. Memory cache first (fast, free, no Upstash quota consumed)
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value as T;
  }
  if (cached) {
    memoryCache.delete(key);
  }

  // 2. Redis fallback on miss
  try {
    const redis = await ensureRedis();
    if (redis) {
      const data = await redis.get(key) as T | null;
      if (data !== null) {
        // Backfill memory cache so subsequent reads don't hit Redis
        memoryCache.set(key, {
          value: data,
          expires: Date.now() + (DEFAULT_TTL * 1000),
        });
        return data;
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Redis get error (non-fatal):', error);
    }
  }

  return null;
}

/**
 * Set data in cache with optional TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  // 1. Always write to memory cache immediately
  memoryCache.set(key, {
    value,
    expires: Date.now() + (ttl * 1000),
  });

  // Periodic cleanup to prevent unbounded growth
  if (memoryCache.size > 1000) {
    cleanupMemoryCache();
  }

  // 2. Fire-and-forget to Redis (non-blocking, best-effort)
  try {
    const redis = await ensureRedis();
    if (redis) {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Redis set error (non-fatal):', error);
    }
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    // Try Redis
    const redis = await ensureRedis();
    if (redis) {
      await redis.del(key);
    }
    // Also remove from memory
    memoryCache.delete(key);
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Delete error (non-fatal):', error);
    }
  }
}

/**
 * Get or set cache - wrapper for cache-aside pattern
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  await setCache(key, data, ttl);
  return data;
}

/**
 * Cache configuration for different data types
 */
export const cacheTTL = {
  manga: {
    list: 300, // 5 minutes
    detail: 600, // 10 minutes
    chapters: 300, // 5 minutes
  },
  chapter: {
    content: 86400, // 24 hours (rarely changes)
    comments: 120, // 2 minutes
  },
  user: {
    profile: 180, // 3 minutes
    library: 300, // 5 minutes
  },
  search: {
    results: 300, // 5 minutes
  },
  leaderboard: {
    global: 60, // 1 minute
    weekly: 300, // 5 minutes
  },
  analytics: {
    dashboard: 300, // 5 minutes
    reading: 60, // 1 minute
  },
} as const;

// Aliases for backward compatibility
export { getCache as getCached, setCache as setCached, deleteCache as deleteCached };

/**
 * Wrap a function with cache (alias for getOrSetCache)
 */
export async function wrapWithCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return getOrSetCache(key, fn, ttl ?? DEFAULT_TTL);
}
