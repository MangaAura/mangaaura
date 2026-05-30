import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis as IoRedis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment && typeof globalThis.process !== 'undefined' && typeof (globalThis.process as any).emit === 'function') {
  try {
    const nodeProcess = globalThis.process as any;
    const originalEmit = nodeProcess.emit.bind(nodeProcess);
    nodeProcess.emit = function (event: string | symbol, ...args: unknown[]): boolean {
      if (event === 'warning' && args[0] instanceof Error) {
        const warning = args[0] as Error;
        if (warning.message?.includes('ioredis') || warning.message?.includes('Unhandled error event') || warning.message?.includes('SSL modes') || warning.message?.includes('pg-connection-string')) {
          return false;
        }
      }
      return originalEmit(event, ...args);
    };
  } catch {
  }
}

let redisAvailable = false;
let redisInstance: IoRedis | null = null;
let upstashInstance: UpstashRedis | null = null;
let mockRedisInstance: MockRedis | null = null;

const globalForRedis = global as unknown as {
  redis?: IoRedis;
  upstash?: UpstashRedis;
  mockRedis?: MockRedis;
};

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

  // ─── Hash operations ──────────────────────────────────────────────

  private hashes = new Map<string, Map<string, string>>();

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    const hash = this.hashes.get(key)!;
    const isNew = !hash.has(field);
    hash.set(field, value);
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const hash = this.hashes.get(key);
    if (!hash) return null;
    const result: Record<string, string> = {};
    for (const [k, v] of hash) result[k] = v;
    return result;
  }

  async hlen(key: string): Promise<number> {
    return this.hashes.get(key)?.size ?? 0;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashes.get(key);
    if (!hash) return 0;
    let deleted = 0;
    for (const field of fields) {
      if (hash.delete(field)) deleted++;
    }
    return deleted;
  }

  // ─── List operations ───────────────────────────────────────────────

  private lists = new Map<string, string[]>();

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.unshift(...values);
    return list.length;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.push(...values);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key);
    if (!list) return [];
    const end = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(start, end);
  }

  async llen(key: string): Promise<number> {
    return this.lists.get(key)?.length ?? 0;
  }

  // ─── Set operations ────────────────────────────────────────────────

  private sets = new Map<string, Set<string>>();

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    const set = this.sets.get(key)!;
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) { set.add(member); added++; }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.sets.get(key)?.has(member) ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    if (set) return Array.from(set);
    // Fallback to store-based smembers
    const item = this.store.get(key);
    if (!item) return [];
    try {
      const arr = JSON.parse(item.value);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  async scard(key: string): Promise<number> {
    const set = this.sets.get(key);
    if (set) return set.size;
    const item = this.store.get(key);
    if (!item) return 0;
    try {
      const arr = JSON.parse(item.value);
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
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

function createIoRedis(): IoRedis {
  const client = new IoRedis(REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
    showFriendlyErrorStack: isDevelopment,
  });

  const silentError = () => {};

  client.on('connect', () => {
    redisAvailable = true;
    if (!isDevelopment) {
      console.log('[Redis] Connected successfully');
    }
  });

  client.on('ready', () => {
    redisAvailable = true;
  });

  client.on('error', (error: Error & { code?: string }) => {
    redisAvailable = false;
    if (isDevelopment) return;
    if (process.env.DEBUG_REDIS) {
      console.error('[Redis] Connection error:', error.message);
    }
  });

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
  client.on('node error', silentError);

  return client;
}

function createUpstashRedis(): UpstashRedis {
  return new UpstashRedis({
    url: UPSTASH_URL || 'https://profound-python-134342.upstash.io',
    token: UPSTASH_TOKEN || '',
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.exp(retryCount) * 100,
    },
  });
}

type RedisClient = IoRedis | UpstashRedis | MockRedis;

function getRedisInstance(): RedisClient {
  // Upstash: always use if credentials available (works in dev and prod)
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    upstashInstance = createUpstashRedis();
    redisAvailable = true;
    return upstashInstance;
  }

  // Development with REDIS_URL: use ioredis
  if (isDevelopment && REDIS_URL) {
    try {
      redisInstance = createIoRedis();
      return redisInstance;
    } catch (error) {
      console.warn('[Redis] Failed to create ioredis client, using mock fallback');
    }
  }

  // Development without Redis: use mock
  if (isDevelopment && !process.env.REDIS_URL && mockRedisInstance) {
    return mockRedisInstance;
  }

  // Fallback to mock
  mockRedisInstance = new MockRedis();
  return mockRedisInstance;
}

export const redis =
  globalForRedis.upstash ||
  globalForRedis.redis ||
  globalForRedis.mockRedis ||
  getRedisInstance();

if (isDevelopment) {
  if (redis instanceof IoRedis) {
    globalForRedis.redis = redis as IoRedis;
  } else if (redis instanceof UpstashRedis) {
    globalForRedis.upstash = redis as UpstashRedis;
  } else {
    globalForRedis.mockRedis = redis as MockRedis;
  }
}

export function isRedisConnected(): boolean {
  return redisAvailable;
}

export function isMockRedis(): boolean {
  return redis instanceof MockRedis;
}

export async function getRedisStatus(): Promise<{
  connected: boolean;
  isMock: boolean;
  mode: string;
}> {
  const isMock = isMockRedis();
  const isUpstash = !isMock && !(redis instanceof IoRedis);
  return {
    connected: isMock || redisAvailable || isUpstash,
    isMock,
    mode: isMock ? 'mock' : isUpstash ? 'connected' : redisAvailable ? 'connected' : 'disconnected',
  };
}

export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
  if (mockRedisInstance) {
    await mockRedisInstance.quit();
    mockRedisInstance = null;
  }
  upstashInstance = null;
  redisAvailable = false;
}