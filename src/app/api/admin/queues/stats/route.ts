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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [emailStats, notificationStats] = await Promise.all([
      getEmailQueue().getStats().catch(() => null),
      getNotificationQueue().getStats().catch(() => null),
    ]);

    return NextResponse.json({
      queues: [
        {
          name: 'emails',
          stats: emailStats ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        },
        {
          name: 'notifications',
          stats: notificationStats ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
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
