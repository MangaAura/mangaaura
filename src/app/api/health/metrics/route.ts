import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getRedisStatus } from '@/lib/redis';
import { getUptimeSeconds, getStartTime } from '@/lib/uptime';

/**
 * GET /api/health/metrics
 *
 * Exposes key application metrics in a Prometheus-compatible plain-text
 * format. Useful for scraping into a monitoring system like Grafana,
 * Datadog, or Prometheus.
 *
 * Note: This is a *basic* metrics endpoint — for a full production setup
 * consider using opentelemetry or @vercel/otel.
 */
export async function GET() {
  const lines: string[] = [];

  // Help / type headers (Prometheus best practice)
  lines.push('# HELP mangaaura_build_info Build and version information');
  lines.push('# TYPE mangaaura_build_info gauge');
  lines.push(
    `mangaaura_build_info{version="${getVersion()}",environment="${process.env.NODE_ENV || 'development'}"} 1`,
  );

  lines.push('');
  lines.push('# HELP mangaaura_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE mangaaura_uptime_seconds counter');
  lines.push(`mangaaura_uptime_seconds ${getUptimeSeconds()}`);

  lines.push('');
  lines.push('# HELP mangaaura_start_time_seconds Start time as Unix timestamp');
  lines.push('# TYPE mangaaura_start_time_seconds gauge');
  lines.push(`mangaaura_start_time_seconds ${Math.floor(getStartTime() / 1000)}`);

  // Memory
  const mem = process.memoryUsage();
  lines.push('');
  lines.push('# HELP mangaaura_memory_bytes Memory usage in bytes');
  lines.push('# TYPE mangaaura_memory_bytes gauge');
  lines.push(`mangaaura_memory_bytes{type="rss"} ${mem.rss}`);
  lines.push(`mangaaura_memory_bytes{type="heap_total"} ${mem.heapTotal}`);
  lines.push(`mangaaura_memory_bytes{type="heap_used"} ${mem.heapUsed}`);
  lines.push(`mangaaura_memory_bytes{type="external"} ${mem.external}`);

  // Database
  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = performance.now() - dbStart;
    lines.push('');
    lines.push('# HELP mangaaura_database_up Whether the database is reachable (1 = up, 0 = down)');
    lines.push('# TYPE mangaaura_database_up gauge');
    lines.push('mangaaura_database_up 1');
    lines.push('# HELP mangaaura_database_latency_ms Database query latency in milliseconds');
    lines.push('# TYPE mangaaura_database_latency_ms gauge');
    lines.push(`mangaaura_database_latency_ms ${dbLatency.toFixed(2)}`);
  } catch {
    lines.push('');
    lines.push('# HELP mangaaura_database_up Whether the database is reachable (1 = up, 0 = down)');
    lines.push('# TYPE mangaaura_database_up gauge');
    lines.push('mangaaura_database_up 0');
  }

  // Redis
  const redisStatus = await getRedisStatus();
  lines.push('');
  lines.push('# HELP mangaaura_redis_up Whether Redis is reachable (1 = up, 0 = down)');
  lines.push('# TYPE mangaaura_redis_up gauge');
  lines.push(`mangaaura_redis_up ${redisStatus.connected ? 1 : 0}`);
  lines.push('# HELP mangaaura_redis_mode Redis connection mode');
  lines.push('# TYPE mangaaura_redis_mode gauge');
  lines.push(`mangaaura_redis_mode{mode="${redisStatus.mode}"} 1`);

  lines.push('');
  lines.push('# EOF');

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// Lazy-loaded version
let _version: string | null = null;

function getVersion(): string {
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
