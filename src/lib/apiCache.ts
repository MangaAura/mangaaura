import { getCache, setCache, invalidatePattern } from './cache';

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  MANGA_LIST: 300, // 5 minutes
  MANGA_DETAIL: 600, // 10 minutes
  USER_PROFILE: 180, // 3 minutes
  LEADERBOARD: 60, // 1 minute
  CHAPTER_CONTENT: 86400, // 24 hours
  SEARCH_RESULTS: 60, // 1 minute (shorter for search)
  COMMENTS: 120, // 2 minutes
  ANALYTICS: 300, // 5 minutes
  RANKINGS: 3600, // 1 hour (stats change infrequently, saves Redis reads)
};

// In-memory cache for frequently accessed data (SSR-safe)
const memoryCache = new Map<string, { data: unknown; expiry: number }>();
const MEMORY_CACHE_TTL = 60_000; // 60 seconds for memory cache (reduces Redis reads)

// Generate cache key with optimization
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  // Filter out undefined/null values and sort keys
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      // Serialize arrays and objects consistently
      const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `${key}:${serialized}`;
    })
    .join(':');
  return `mangaaura:${prefix}:${sortedParams}`;
}

// Memory cache helper for ultra-fast access
function getFromMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  if (cached) {
    memoryCache.delete(key);
  }
  return null;
}

function setInMemoryCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expiry: Date.now() + MEMORY_CACHE_TTL });
  
  // Limit memory cache size
  if (memoryCache.size > 1000) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
}

// Cache wrapper for API calls with memory caching
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
  options?: { useMemoryCache?: boolean }
): Promise<T> {
  const { useMemoryCache = true } = options || {};

  // Try memory cache first (ultra-fast)
  if (useMemoryCache) {
    const memoryCached = getFromMemoryCache<T>(key);
    if (memoryCached) {
      return memoryCached;
    }
  }

  // Try Redis cache
  const cached = await getCache<T>(key);
  if (cached) {
    // Store in memory cache for faster access
    if (useMemoryCache) {
      setInMemoryCache(key, cached);
    }
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in both caches
  await Promise.all([
    setCache(key, data, ttl),
    useMemoryCache ? setInMemoryCache(key, data) : Promise.resolve(),
  ]);

  return data;
}

// Batch cache invalidation
export async function invalidateCacheBatch(prefixes: string[]): Promise<void> {
  await Promise.all(prefixes.map(prefix => invalidateCache(prefix)));
}

// Invalidate cache by pattern
export async function invalidateCache(prefix: string): Promise<void> {
  await invalidatePattern(`mangaaura:${prefix}:*`);

  // Also clear memory cache entries matching the prefix
  const pattern = `mangaaura:${prefix}`;
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// Cache configuration for different endpoints
export const cacheConfig = {
  manga: {
    list: { ttl: CACHE_TTL.MANGA_LIST, prefix: 'manga:list' },
    detail: { ttl: CACHE_TTL.MANGA_DETAIL, prefix: 'manga:detail' },
    chapters: { ttl: CACHE_TTL.MANGA_DETAIL, prefix: 'manga:chapters' },
  },
  user: {
    profile: { ttl: CACHE_TTL.USER_PROFILE, prefix: 'user:profile' },
    library: { ttl: CACHE_TTL.USER_PROFILE, prefix: 'user:library' },
    achievements: { ttl: CACHE_TTL.USER_PROFILE, prefix: 'user:achievements' },
  },
  gamification: {
    leaderboard: { ttl: CACHE_TTL.LEADERBOARD, prefix: 'gamification:leaderboard' },
    rankings: { ttl: CACHE_TTL.RANKINGS, prefix: 'gamification:rankings' },
  },
  search: {
    results: { ttl: CACHE_TTL.SEARCH_RESULTS, prefix: 'search:results' },
  },
  comments: {
    list: { ttl: CACHE_TTL.COMMENTS, prefix: 'comments:list' },
  },
  analytics: {
    creator: { ttl: CACHE_TTL.ANALYTICS, prefix: 'analytics:creator' },
  },
  stats: {
    homepage: { ttl: CACHE_TTL.RANKINGS, prefix: 'stats:homepage' },
  },
};

// Performance utility: Debounce function for frequent operations
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

// Performance utility: Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      lastTime = now;
      fn(...args);
    }
  };
}

// Export cache TTL constants for use elsewhere
export { CACHE_TTL };
