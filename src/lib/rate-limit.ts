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

  // ── Pure in-memory rate limiting (costs 0 Redis quota) ──
  // Redis sync was removed: with a single server instance, in-memory
  // is perfectly sufficient. This eliminates 100% of Redis commands
  // from rate-limiting — the #1 source of Redis consumption.
  const memEntry = inMemoryStore.get(key);
  if (memEntry && memEntry.resetAt > now) {
    memEntry.count += 1;
    return {
      allowed: memEntry.count <= limit,
      remaining: Math.max(0, limit - memEntry.count),
      resetAt: memEntry.resetAt,
    };
  }
  inMemoryStore.set(key, { count: 1, resetAt });

  return { allowed: true, remaining: limit - 1, resetAt };
}

export function getRateLimitKey(prefix: string, identifier: string): string {
  return `ratelimit:${prefix}:${identifier}`;
}
