import { redis } from './redis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

const IN_MEMORY_CLEANUP_INTERVAL = 60_000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore) {
      if (entry.resetAt <= now) inMemoryStore.delete(key);
    }
  }, IN_MEMORY_CLEANUP_INTERVAL);
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt: now + ttl * 1000,
    };
  } catch (_error) {
    console.warn('[rate-limit] Redis unavailable, using in-memory fallback');
    const entry = inMemoryStore.get(key);
    if (entry && entry.resetAt > now) {
      entry.count += 1;
      return {
        allowed: entry.count <= limit,
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
      };
    }
    inMemoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
}

export function getRateLimitKey(prefix: string, identifier: string): string {
  return `ratelimit:${prefix}:${identifier}`;
}
