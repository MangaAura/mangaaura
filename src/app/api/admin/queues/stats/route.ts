/**
 * GET /api/admin/queues/stats
 *
 * Devuelve estadísticas de todas las colas BullMQ para monitoreo.
 * Protegido: solo accesible por admins.
 */

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { getNotificationQueue } from '@/infrastructure/queue/NotificationQueue';
import { getInferenceJobQueue } from '@/infrastructure/queue/InferenceJobQueue';
import { getInboundEmailQueue } from '@/infrastructure/queue/InboundEmailQueue';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailQueue = getEmailQueue();
    const notificationQueue = getNotificationQueue();
    const inferenceQueue = getInferenceJobQueue();
    const inboundQueue = getInboundEmailQueue();

    const [emailStats, notificationStats, inferenceStats, inboundStats, emailMetrics, notificationMetrics, inboundMetrics] = await Promise.all([
      emailQueue.getStats().catch(() => null),
      notificationQueue.getStats().catch(() => null),
      inferenceQueue.getStats(),
      inboundQueue.getStats().catch(() => null),
      emailQueue.getWorkerMetrics().catch(() => null),
      notificationQueue.getWorkerMetrics().catch(() => null),
      inboundQueue.getWorkerMetrics().catch(() => null),
    ]);

    return NextResponse.json({
      queues: [
        {
          name: 'emails',
          stats: emailStats ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          workerMetrics: emailMetrics,
        },
        {
          name: 'notifications',
          stats: notificationStats ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          workerMetrics: notificationMetrics,
        },
        {
          name: 'inbound-emails',
          stats: inboundStats ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          workerMetrics: inboundMetrics,
        },
        {
          name: 'inference',
          stats: inferenceStats
            ? {
                waiting: inferenceStats.length,
                active: inferenceStats.processing,
                completed: inferenceStats.completed,
                failed: inferenceStats.failed,
                delayed: 0,
              }
            : { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          rawStats: inferenceStats,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Queue Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue stats' },
      { status: 500 },
    );
  }
}
