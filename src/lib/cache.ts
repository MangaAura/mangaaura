import { redis as appRedis, isQuotaExceeded, isMockRedis } from './redis';

/**
 * Usamos la instancia compartida de redis.ts que incluye el Proxy
 * de detección de cuota. Cuando la cuota se excede, todas las
 * operaciones Redis se redirigen automáticamente a MockRedis.
 *
 * Hacemos un cast a `any` porque los tipos de `@upstash/redis`,
 * `ioredis` y nuestro `MockRedis` son incompatibles entre sí.
 * Todas las operaciones están envueltas en try-catch.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const redis: any = appRedis;

const isRedisConfigured = !isMockRedis() && !isQuotaExceeded();

// Default TTL values (in seconds)
const DEFAULT_TTL = 3600; // 1 hour
const CACHE_PREFIXES = {
  MANGA: 'manga',
  CHAPTER: 'chapter',
  USER: 'user',
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  COMMENTS: 'comments',
  LEADERBOARD: 'leaderboard',
  NOTIFICATIONS: 'notifications',
} as const;

// In-memory fallback cache
const memoryCache = new Map<string, { value: unknown; expires: number }>();

/**
 * Generate a cache key with prefix
 */
export function generateCacheKey(prefix: string, identifier: string | Record<string, unknown>): string {
  const suffix = typeof identifier === 'string'
    ? identifier
    : Object.entries(identifier)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':');

  return `mangaaura:${prefix}:${suffix}`;
}

/**
 * Get data from cache (memory first, then Redis)
 *
 * ✅ Memory-First Strategy:
 *    Checks the in-memory cache BEFORE Redis, dramatically reducing
 *    Upstash free-tier command usage. Redis is only consulted on a
 *    memory miss or when the memory entry has expired.
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

  // 2. Redis fallback on miss (consumes Upstash quota)
  try {
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
    // Silenciar errores en producción para no llenar logs si Redis está caído
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Redis get error (non-fatal):', error);
    }
  }

  return null;
}

/**
 * Set data in cache with optional TTL
 *
 * ✅ Memory-First Strategy:
 *    Always writes to the in-memory cache. Redis write is fire-and-forget
 *    so a failure never blocks the caller or wastes user time.
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
    if (redis) {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
    }
  } catch (error) {
    // Silenciar en producción
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Redis set error (non-fatal):', error);
    }
  }
}

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires <= now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Delete a specific cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    // Try Redis
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
 * Invalidate cache by pattern
 *
 * ✅ Memory-Only Strategy:
 *    Only clears the in-memory cache. The Redis TTL handles stale entries
 *    automatically — no need for expensive SCAN+DEL. This saves thousands
 *    of Redis commands per day and eliminates the biggest source of
 *    read-after-invalidation Redis calls.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // Clean memory cache matching pattern (fast, zero Redis cost)
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/[+?^${}()|[\]\\]/g, '\\$&'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
    // Redis invalidation is skipped intentionally.
    // The TTL will expire stale entries naturally.
    // This saves ~2-10+ Redis commands per invalidation.
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Invalidation error (non-fatal):', error);
    }
  }
}

/**
 * Get or set cache - wrapper for cache-aside pattern
 *
 * ✅ Memory-First Strategy:
 *    Reads hit memory first. Redis is only involved on a cold cache.
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
  // Fire-and-forget — setCache handles both memory and Redis
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

/**
 * Invalidate manga-related caches
 */
export async function invalidateMangaCache(mangaId?: string): Promise<void> {
  if (mangaId) {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.MANGA}:*${mangaId}*`);
  } else {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.MANGA}:*`);
  }
}

/**
 * Invalidate chapter-related caches
 */
export async function invalidateChapterCache(chapterId?: string): Promise<void> {
  if (chapterId) {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.CHAPTER}:*${chapterId}*`);
  } else {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.CHAPTER}:*`);
  }
}

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(userId?: string): Promise<void> {
  if (userId) {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.USER}:*${userId}*`);
  } else {
    await invalidatePattern(`mangaaura:${CACHE_PREFIXES.USER}:*`);
  }
}

// Export redis instance for direct access if needed
export { CACHE_PREFIXES, isRedisConfigured };

// Aliases for backward compatibility
export { getCache as getCached, setCache as setCached, deleteCache as deleteCached, invalidateUserCache as invalidateCache };

export async function wrapWithCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return getOrSetCache(key, fn, ttl ?? DEFAULT_TTL);
}
