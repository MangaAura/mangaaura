/**
 * Queue Push Notification Adapter
 *
 * Implementa IPushNotificationService usando BullMQ NotificationQueue
 * en lugar de enviar push notifications directamente.
 *
 * Esto permite:
 * - Retry con backoff exponencial si la push falla
 * - Rate limiting (30 jobs/s) via el worker
 * - Visibilidad en el panel de admin
 * - Monitoreo con Sentry cuando el worker reporta fallos
 *
 * Si BullMQ/Redis no está disponible (dev), fallback al PushNotificationAdapter directo.
 *
 * @packageDocumentation
 */

import type { IPushNotificationService } from '@/core/services/INotificationRepository';
import { isMockRedis } from '@/lib/redis';

let directAdapter: IPushNotificationService | null = null;

async function getDirectAdapter(): Promise<IPushNotificationService> {
  if (!directAdapter) {
    const { PushNotificationAdapter } = await import(
      '@/infrastructure/adapters/PrismaNotificationRepository'
    );
    directAdapter = new PushNotificationAdapter();
  }
  return directAdapter;
}

export class QueuePushNotificationAdapter implements IPushNotificationService {
  async sendToUser(
    userId: string,
    data: {
      title: string;
      body: string;
      icon?: string;
      url?: string;
      tag?: string;
    },
  ): Promise<void> {
    // En desarrollo sin Redis, usar adaptador directo (no hay cola BullMQ real)
    if (isMockRedis()) {
      const adapter = await getDirectAdapter();
      return adapter.sendToUser(userId, data);
    }

    try {
      const { getNotificationQueue } = await import(
        '@/infrastructure/queue/NotificationQueue'
      );
      const queue = getNotificationQueue();

      await queue.addPushNotification({
        userId,
        payload: {
          title: data.title,
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: data.tag || 'default',
          url: data.url || '/',
        },
      });
    } catch (error) {
      // Fallback si la cola falla (ej. Redis no disponible temporalmente)
      console.warn(
        '[QueuePushNotificationAdapter] Queue unavailable, falling back to direct push:',
        error,
      );
      const adapter = await getDirectAdapter();
      await adapter.sendToUser(userId, data);
    }
  }
}

export default QueuePushNotificationAdapter;
