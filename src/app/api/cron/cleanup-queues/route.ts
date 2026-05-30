/**
 * CRON: Cleanup old queue jobs
 *
 * Ejecuta cleanup de las colas BullMQ (EmailQueue, NotificationQueue)
 * para eliminar jobs completados y fallidos antiguos.
 *
 * Llamada esperada: POST /api/cron/cleanup-queues
 * Autenticación: Bearer token con CRON_SECRET
 *
 * @packageDocumentation
 */

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/cron/cleanup-queues - Cleanup old queue jobs
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (
      !authHeader ||
      !expectedAuth ||
      authHeader.length !== expectedAuth.length ||
      !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: Record<string, unknown> = {};

    // 1. Cleanup NotificationQueue
    try {
      const { getNotificationQueue } = await import('@/infrastructure/queue/NotificationQueue');
      const queue = getNotificationQueue();
      const statsBefore = await queue.getStats();
      await queue.clean(24); // Clean jobs older than 24h
      const statsAfter = await queue.getStats();
      results.notificationQueue = {
        before: statsBefore,
        after: statsAfter,
      };
    } catch (error) {
      console.error('[CRON] Error cleaning NotificationQueue:', error);
      results.notificationQueue = { error: String(error) };
    }

    // 2. Cleanup EmailQueue
    try {
      const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
      const emailQueue = getEmailQueue();
      const statsBefore = await emailQueue.getStats();
      await emailQueue.cleanOldJobs(48); // Clean jobs older than 48h
      const statsAfter = await emailQueue.getStats();
      results.emailQueue = {
        before: statsBefore,
        after: statsAfter,
      };
    } catch (error) {
      console.error('[CRON] Error cleaning EmailQueue:', error);
      results.emailQueue = { error: String(error) };
    }

    return NextResponse.json({
      success: true,
      message: 'Queues cleaned successfully',
      results,
    });
  } catch (error) {
    console.error('[CRON] Error cleaning queues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
