/**
 * Memory-only cache operations.
 *
 * ✅ No Redis imports — safe to import from Client Components.
 *    Redis-backed caching lives in cache.ts which imports this module.
 */

/** Default TTL (seconds) */
export const DEFAULT_TTL = 3600;

/** In-memory cache store (shared across cache.ts and memory-cache.ts) */
export const memoryCache = new Map<string, { value: unknown; expires: number }>();

/** Cache key prefixes */
export const CACHE_PREFIXES = {
  MANGA: 'manga',
  CHAPTER: 'chapter',
  USER: 'user',
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  COMMENTS: 'comments',
  LEADERBOARD: 'leaderboard',
  NOTIFICATIONS: 'notifications',
} as const;

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
 * Clean up expired entries from memory cache
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires <= now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Invalidate cache by pattern (memory only — Redis TTL handles server-side cleanup).
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const regex = new RegExp(pattern.replace(/\\*/g, '.*').replace(/[+?^${}()|[\]\\\\]/g, '\\$&'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_REDIS) {
      console.warn('[Cache] Invalidation error (non-fatal):', error);
    }
  }
}

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
