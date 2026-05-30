/**
 * Admin API: Queue Actions
 *
 * Endpoint unificado para acciones sobre colas BullMQ:
 * - pause: Pausar una cola
 * - resume: Reanudar una cola
 * - retry-failed: Reintentar jobs fallidos
 * - clean: Limpiar jobs antiguos
 *
 * POST /api/admin/queues/action
 * Body: { queue: string; action: string }
 *
 * @packageDocumentation
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

async function getQueue(queueName: string) {
  switch (queueName) {
    case 'emails': {
      const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
      return getEmailQueue();
    }
    case 'notifications': {
      const { getNotificationQueue } = await import('@/infrastructure/queue/NotificationQueue');
      return getNotificationQueue();
    }
    case 'inbound-emails': {
      const { getInboundEmailQueue } = await import('@/infrastructure/queue/InboundEmailQueue');
      return getInboundEmailQueue();
    }
    case 'inference': {
      const { getInferenceJobQueue } = await import('@/infrastructure/queue/InferenceJobQueue');
      return getInferenceJobQueue();
    }
    default:
      return null;
  }
}

interface QueueWithActions {
  name: string;
  pause(): Promise<void>;
  resume(): Promise<void>;
  clean?(hours: number): Promise<void>;
  retryFailed?(limit: number): Promise<number>;
  getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.queue || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: queue, action' },
        { status: 400 },
      );
    }

    const { queue: queueName, action } = body;

    const queue = (await getQueue(queueName)) as unknown as QueueWithActions | null;
    if (!queue) {
      return NextResponse.json(
        { error: `Unknown queue: ${queueName}` },
        { status: 400 },
      );
    }

    switch (action) {
      case 'pause': {
        await queue.pause();
        const stats = await queue.getStats();
        return NextResponse.json({
          success: true,
          message: `${queueName} queue paused`,
          stats,
        });
      }

      case 'resume': {
        await queue.resume();
        const stats = await queue.getStats();
        return NextResponse.json({
          success: true,
          message: `${queueName} queue resumed`,
          stats,
        });
      }

      case 'retry-failed': {
        if (!queue.retryFailed) {
          return NextResponse.json(
            { error: `retry-failed not supported for ${queueName} queue` },
            { status: 400 },
          );
        }
        const limit = body.limit ?? 50;
        const retried = await queue.retryFailed(limit);
        const stats = await queue.getStats();
        return NextResponse.json({
          success: true,
          message: `Retried ${retried} failed jobs in ${queueName} queue`,
          retried,
          stats,
        });
      }

      case 'clean': {
        if (!queue.clean) {
          return NextResponse.json(
            { error: `clean not supported for ${queueName} queue` },
            { status: 400 },
          );
        }
        const hours = body.hours ?? 24;
        const statsBefore = await queue.getStats();
        await queue.clean(hours);
        const statsAfter = await queue.getStats();
        return NextResponse.json({
          success: true,
          message: `${queueName} queue cleaned (older than ${hours}h)`,
          before: statsBefore,
          after: statsAfter,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: pause, resume, retry-failed, clean` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[Queue Action API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
