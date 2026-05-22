import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client with Upstash only if configured
let redis: Redis | null = null;

if (isRedisConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.info('[Cache] Redis configured successfully');
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
  }
} else {
  console.info('[Cache] Redis not configured - using memory fallback');
}

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
 * Get data from cache (Redis or memory fallback)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (redis) {
      const data = await redis.get<T>(key);
      if (data) return data;
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }
    
    // Expired or not found - clean up
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * Set data in cache with optional TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    // Try Redis first
    if (redis) {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
      return;
    }
    
    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
    });
    
    // Clean up old entries periodically
    if (memoryCache.size > 1000) {
      cleanupMemoryCache();
    }
  } catch (error) {
    console.error('[Cache] Set error:', error);
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
    console.error('[Cache] Delete error:', error);
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // Try Redis
    if (redis) {
      let cursor = 0;
      const keysToDelete: string[] = [];

      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = Number(result[0]);
        keysToDelete.push(...result[1]);
      } while (cursor !== 0);

      if (keysToDelete.length > 0) {
        for (let i = 0; i < keysToDelete.length; i += 100) {
          const batch = keysToDelete.slice(i, i + 100);
          await redis.del(...batch);
        }
      }
    }
    
    // Also clean memory cache matching pattern
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
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
export { redis, CACHE_PREFIXES, isRedisConfigured };

// Aliases for backward compatibility
export { getCache as getCached, setCache as setCached, deleteCache as deleteCached, invalidateUserCache as invalidateCache };

export async function wrapWithCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return getOrSetCache(key, fn, ttl ?? DEFAULT_TTL);
}
