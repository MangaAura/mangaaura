import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
    const overall: string[] = [];

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok', latency: Date.now() - start };
      overall.push('database');
    } catch (e: any) {
      checks.database = { status: 'error', error: e.message };
    }

    try {
      const start = Date.now();
      const res = await fetch(`${process.env.REDIS_URL || 'redis://localhost:6379'}/ping`, { signal: AbortSignal.timeout(3000) });
      checks.redis = { status: res.ok ? 'ok' : 'degraded', latency: Date.now() - start };
      overall.push('redis');
    } catch {
      checks.redis = { status: 'unavailable', error: 'Could not connect to Redis' };
    }

    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    const dbConnected = checks.database?.status === 'ok';

    const [userCount, mangaCount, chapterCount] = await Promise.all([
      dbConnected ? prisma.user.count() : 0,
      dbConnected ? prisma.mangaSeries.count() : 0,
      dbConnected ? prisma.chapter.count() : 0,
    ]);

    const allOk = Object.values(checks).every((c) => c.status === 'ok');

    return NextResponse.json({
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(uptime),
      memory: { usedMB: memUsedMB, totalMB: memTotalMB, pct: Math.round((memUsedMB / memTotalMB) * 100) },
      checks,
      stats: { users: userCount, mangas: mangaCount, chapters: chapterCount },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ status: 'error', error: 'Internal server error' }, { status: 500 });
  }
}