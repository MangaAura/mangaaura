import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getRedisStatus } from '@/lib/redis';
import { getUptimeSeconds, getUptimeHuman, getUptimeISO, getStartTime } from '@/lib/uptime';

// ── Version ──────────────────────────────────────────────────────────────

let _version: string | null = null;

function getAppVersion(): string {
  if (_version) return _version;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@/../package.json') as { version?: string };
    _version = pkg.version || '0.0.0';
  } catch {
    _version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || '0.0.0';
  }
  return _version;
}

// ── Sentry check ─────────────────────────────────────────────────────────

function isSentryInitialized(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs') as { getClient?: () => unknown };
    return typeof Sentry.getClient === 'function' && !!Sentry.getClient();
  } catch {
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const startTime = performance.now();

  const redisStatus = await getRedisStatus();

  // Database check
  let dbHealthy = false;
  let dbLatencyMs = 0;
  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(performance.now() - dbStart);
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  // Memory usage
  const mem = process.memoryUsage();

  const checks = {
    database: dbHealthy,
    databaseLatencyMs: dbLatencyMs,
    redis: redisStatus.connected,
    redisMode: redisStatus.mode as 'connected' | 'disconnected' | 'mock',
    sentry: isSentryInitialized(),
    uptime: {
      seconds: getUptimeSeconds(),
      human: getUptimeHuman(),
      iso: getUptimeISO(),
      startedAt: new Date(getStartTime()).toISOString(),
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      externalMb: Math.round(mem.external / 1024 / 1024 * 100) / 100,
    },
    version: getAppVersion(),
    environment: process.env.NODE_ENV || 'development',
    responseTimeMs: Math.round(performance.now() - startTime),
    timestamp: new Date().toISOString(),
  };

  const allHealthy = checks.database && (checks.redis || checks.redisMode === 'mock');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      ...checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
