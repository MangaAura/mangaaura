/**
 * GET /api/health/workers
 *
 * Health check específico para workers BullMQ.
 * Reporta si cada worker está inicializado y en qué modo (real vs mock).
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

  const allInitialized = Object.values(results).every((r) => r.initialized);

  return NextResponse.json(
    {
      status: allInitialized ? 'healthy' : 'degraded',
      workers: results,
      total: Object.keys(results).length,
      initialized: Object.values(results).filter((r) => r.initialized).length,
      timestamp: new Date().toISOString(),
    },
    {
      status: allInitialized ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
