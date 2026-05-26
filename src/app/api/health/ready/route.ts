import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getRedisStatus } from '@/lib/redis';

/**
 * GET /api/health/ready
 *
 * Readiness probe — lightweight check used by orchestrators (Kubernetes,
 * Vercel Cron, etc.) to know if the application is ready to accept traffic.
 *
 * Returns 200 + { status: "ready" } when all critical dependencies are
 * reachable. Returns 503 + { status: "not_ready" } otherwise.
 *
 * This endpoint is intentionally lighter than the full /api/health check
 * so probes don't cause significant load.
 */
export async function GET() {
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  const redisStatus = await getRedisStatus();

  const ready = dbHealthy && (redisStatus.connected || redisStatus.mode === 'mock');

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'not_ready',
      database: dbHealthy,
      redis: redisStatus.connected,
      redisMode: redisStatus.mode,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
