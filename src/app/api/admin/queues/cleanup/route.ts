/**
 * Admin API: Queue Cleanup
 *
 * Limpia jobs completados y fallidos antiguos de las colas BullMQ.
 * Usa autenticación de sesión (admin role) en vez de CRON_SECRET.
 *
 * POST /api/admin/queues/cleanup
 *
 * @packageDocumentation
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const results: Record<string, unknown> = {};

    // 1. Cleanup NotificationQueue
    try {
      const { getNotificationQueue } = await import('@/infrastructure/queue/NotificationQueue');
      const queue = getNotificationQueue();
      const statsBefore = await queue.getStats();
      await queue.clean(24);
      const statsAfter = await queue.getStats();
      results.notificationQueue = {
        before: statsBefore,
        after: statsAfter,
      };
    } catch (error) {
      console.error('[Admin] Error cleaning NotificationQueue:', error);
      results.notificationQueue = { error: String(error) };
    }

    // 2. Cleanup EmailQueue
    try {
      const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
      const emailQueue = getEmailQueue();
      const statsBefore = await emailQueue.getStats();
      await emailQueue.cleanOldJobs(48);
      const statsAfter = await emailQueue.getStats();
      results.emailQueue = {
        before: statsBefore,
        after: statsAfter,
      };
    } catch (error) {
      console.error('[Admin] Error cleaning EmailQueue:', error);
      results.emailQueue = { error: String(error) };
    }

    // 3. Cleanup InferenceJobQueue (clear dead letter queue + persistence)
    try {
      const { getInferenceJobQueue } = await import('@/infrastructure/queue/InferenceJobQueue');
      const iq = getInferenceJobQueue();
      const statsBefore = iq.getStats();
      const deadLetterCleared = iq.clearDeadLetterQueue();
      await iq.clearPersistence();
      const statsAfter = iq.getStats();
      results.inferenceQueue = {
        before: statsBefore,
        after: statsAfter,
        deadLetterCleared,
      };
    } catch (error) {
      console.error('[Admin] Error cleaning InferenceJobQueue:', error);
      results.inferenceQueue = { error: String(error) };
    }

    // 4. Cleanup InboundEmailQueue
    try {
      const { getInboundEmailQueue } = await import('@/infrastructure/queue/InboundEmailQueue');
      const q = getInboundEmailQueue();
      const statsBefore = await q.getStats();
      await q.clean(24);
      const statsAfter = await q.getStats();
      results.inboundEmailQueue = {
        before: statsBefore,
        after: statsAfter,
      };
    } catch (error) {
      console.error('[Admin] Error cleaning InboundEmailQueue:', error);
      results.inboundEmailQueue = { error: String(error) };
    }

    return NextResponse.json({
      success: true,
      message: 'Queues cleaned successfully',
      results,
    });
  } catch (error) {
    console.error('[Admin] Error cleaning queues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
