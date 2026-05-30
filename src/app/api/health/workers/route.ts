/**
 * GET /api/health/workers
 *
 * Health check específico para workers BullMQ.
 * Reporta si cada worker está inicializado, en qué modo (real vs mock),
 * estado del circuit breaker de Redis, y métricas de conexión.
 * No requiere autenticación — es usado por monitoreo interno.
 *
 * @packageDocumentation
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, { initialized: boolean; mode: string }> = {};

  // ── Email Worker ───────────────────────────────────────────────────
  try {
    const { getEmailWorker } = await import('@/infrastructure/workers/EmailWorker');
    const worker = getEmailWorker();
    results.email = {
      initialized: true,
      mode: (worker as any).isMock ? 'mock' : 'bullmq',
    };
  } catch {
    results.email = { initialized: false, mode: 'error' };
  }

  // ── Notification Worker ────────────────────────────────────────────
  try {
    const { getNotificationWorker } = await import('@/infrastructure/workers/NotificationWorker');
    const worker = getNotificationWorker();
    results.notifications = {
      initialized: true,
      mode: (worker as any).isMock ? 'mock' : 'bullmq',
    };
  } catch {
    results.notifications = { initialized: false, mode: 'error' };
  }

  // ── Inbound Email Worker ───────────────────────────────────────────
  try {
    const { getInboundEmailWorker } = await import('@/infrastructure/workers/InboundEmailWorker');
    const worker = getInboundEmailWorker();
    results['inbound-emails'] = {
      initialized: true,
      mode: (worker as any).isMock ? 'mock' : 'bullmq',
    };
  } catch {
    results['inbound-emails'] = { initialized: false, mode: 'error' };
  }

  // ── Redis Connection Metrics ───────────────────────────────────────
  let connectionMetrics: Record<string, unknown> = { healthy: false, isMock: true };
  let circuitBreakerMetrics: Record<string, unknown> = { state: 'CLOSED' };

  try {
    const { getConnectionMetrics, checkRedisHealth } = await import(
      '@/infrastructure/queue/connection'
    );
    const { getRedisCircuitBreaker } = await import('@/lib/circuit-breaker');

    connectionMetrics = {
      ...getConnectionMetrics(),
      ping: await checkRedisHealth(),
    } as Record<string, unknown>;
    circuitBreakerMetrics = getRedisCircuitBreaker().getMetrics() as Record<string, unknown>;
  } catch {
    connectionMetrics = { healthy: false, isMock: true, error: 'Failed to load connection' };
  }

  const allInitialized = Object.values(results).every((r) => r.initialized);
  const circuitOpen = circuitBreakerMetrics.state === 'OPEN';

  return NextResponse.json(
    {
      status: allInitialized && !circuitOpen ? 'healthy' : 'degraded',
      workers: results,
      redis: {
        connection: connectionMetrics,
        circuitBreaker: circuitBreakerMetrics,
      },
      total: Object.keys(results).length,
      initialized: Object.values(results).filter((r) => r.initialized).length,
      timestamp: new Date().toISOString(),
    },
    {
      status: allInitialized && !circuitOpen ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
