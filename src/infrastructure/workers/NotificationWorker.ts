/**
 * Notification Worker for MangaAura
 * Procesa jobs de la cola de notificaciones usando BullMQ.
 *
 * Crea notificaciones in-app en la BD y envía push notifications
 * a los navegadores de los usuarios.
 *
 * @packageDocumentation
 */

import { Worker, Job } from 'bullmq';

import type { NotificationType } from '@/core/services/NotificationService';
import { getBullConnection } from '@/infrastructure/queue/connection';
import type {
  NotificationJobData,
  InAppNotificationData,
  PushNotificationData,
  CombinedNotificationData,
  BulkPushNotificationData,
} from '@/infrastructure/queue/NotificationQueue';
import { getNotificationService } from '@/core/services/NotificationService';
import { sendPushNotification, sendBulkPushNotifications } from '@/lib/push-notifications';
import { captureException } from '@/lib/sentry';

// ============================================================================
// Notification Worker
// ============================================================================

export class NotificationWorker {
  private worker: Worker | null = null;

  constructor() {
    this.initializeWorker();
  }

  /**
   * Inicializa el worker de notificaciones con BullMQ
   */
  private initializeWorker(): void {
    try {
      this.worker = new Worker(
        'notifications',
        async (job: Job<NotificationJobData>) => {
          await this.processJob(job);
        },
        {
          connection: getBullConnection(),
          concurrency: 10,
          limiter: {
            max: 30,
            duration: 1000, // 30 jobs per second max
          },
          stalledInterval: 30000,
          maxStalledCount: 3,
        },
      );

      this.setupEventHandlers();
    } catch (error) {
      console.error('[NotificationWorker] Failed to initialize:', error);
    }
  }

  /**
   * Configura los event handlers del worker
   */
  private setupEventHandlers(): void {
    if (!this.worker) return;

    this.worker.on('completed', (job: Job) => {
      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_QUEUE) {
        const data = job.data as NotificationJobData;
        console.info(`[NotificationWorker] Job ${job.id} completed: ${data.type}`);
      }
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      if (job) {
        const data = job.data as NotificationJobData;
        console.error(`[NotificationWorker] Job ${job.id} failed (${data.type}):`, err.message);
        captureException(err, {
          extra: {
            jobId: job.id,
            jobType: data.type,
            queue: 'notifications',
          },
        });
      } else {
        captureException(err, {
          extra: { queue: 'notifications', jobId: 'unknown' },
        });
      }
    });

    this.worker.on('error', (error: Error) => {
      console.error('[NotificationWorker] Worker error:', error.message);
      captureException(error, {
        extra: { queue: 'notifications' },
      });
    });

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`[NotificationWorker] Job ${jobId} stalled — possible worker crash`);
      captureException(new Error('NotificationWorker job stalled'), {
        extra: { jobId, queue: 'notifications' },
      });
    });
  }

  /**
   * Procesa un job según su tipo
   */
  private async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;

    switch (data.type) {
      case 'in-app':
        await this.processInAppNotification(data);
        break;
      case 'push':
        await this.processPushNotification(data);
        break;
      case 'in-app-with-push':
        await this.processCombinedNotification(data);
        break;
      case 'bulk-push':
        await this.processBulkPushNotification(data);
        break;
      default:
        throw new Error(`Unknown notification job type: ${(data as NotificationJobData).type}`);
    }
  }

  /**
   * Crea una notificación in-app en la BD
   */
  private async processInAppNotification(data: InAppNotificationData): Promise<void> {
    const notificationService = await getNotificationService();
    await notificationService.createNotification({
      userId: data.userId,
      type: data.notificationType as NotificationType,
      title: data.title,
      message: data.message,
      data: data.data,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
    });
  }

  /**
   * Envía una push notification al navegador del usuario
   */
  private async processPushNotification(data: PushNotificationData): Promise<void> {
    const result = await sendPushNotification(data.userId, data.payload);
    if (!result.success && result.error) {
      console.warn(`[NotificationWorker] Push notification failed for ${data.userId}: ${result.error}`);
    }
  }

  /**
   * Crea notificación in-app + push en paralelo
   */
  private async processCombinedNotification(data: CombinedNotificationData): Promise<void> {
    const notificationService = await getNotificationService();

    await Promise.all([
      // Create in-app notification
      notificationService.createNotification({
        userId: data.userId,
        type: data.notificationType as NotificationType,
        title: data.title,
        message: data.message,
        data: data.data,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
      }),
      // Send push notification
      sendPushNotification(data.userId, data.pushPayload).catch((err) => {
        console.warn(`[NotificationWorker] Push failed for ${data.userId}:`, err.message);
      }),
    ]);
  }

  /**
   * Envía push notifications a múltiples usuarios
   */
  private async processBulkPushNotification(data: BulkPushNotificationData): Promise<void> {
    const result = await sendBulkPushNotifications(data.userIds, data.payload);
    if (result.failed > 0) {
      console.warn(
        `[NotificationWorker] Bulk push: ${result.sent} sent, ${result.failed} failed`,
      );
    }
  }

  /**
   * Cierra el worker
   */
  async close(): Promise<void> {
    await this.worker?.close();
  }
}

let globalWorker: NotificationWorker | null = null;

export function getNotificationWorker(): NotificationWorker {
  if (!globalWorker) {
    globalWorker = new NotificationWorker();
  }
  return globalWorker;
}

export function stopNotificationWorker(): void {
  globalWorker?.close();
  globalWorker = null;
}

export default NotificationWorker;
