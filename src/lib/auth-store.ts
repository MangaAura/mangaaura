/**
 * Auth Store — In-Memory
 *
 * Replaces Redis for all auth-related ephemeral data:
 *   - Password reset tokens
 *   - 2FA confirmations
 *   - Session invalidation flags
 *
 * All data is lost on server restart — acceptable because:
 *   - A lost reset token just means the user requests a new one
 *   - A lost 2FA confirmation just means re-entering the code
 *   - A lost session invalidation is temporary (JWT expiry handles it)
 *
 * ✅ Zero Redis commands from auth flows.
 */

interface StoredEntry {
  value: string;
  expiresAt: number;
}

const store = new Map<string, StoredEntry>();

// Periodic cleanup every 60 seconds (only runs in Node.js/server environments)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000).unref();
}

/**
 * Store a token with TTL.
 */
export function setToken(key: string, value: string, ttlSeconds: number): void {
  // Evict oldest entry if store grows too large (safety limit)
  if (store.size >= 10_000) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Retrieve a token. Returns null if not found or expired.
 */
export function getToken(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Delete a token.
 */
export function deleteToken(key: string): void {
  store.delete(key);
}
