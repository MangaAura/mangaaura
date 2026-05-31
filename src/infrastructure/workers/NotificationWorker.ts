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
import { getNotificationService } from '@/core/services/NotificationService';
import { getBullConnection } from '@/infrastructure/queue/connection';
import type {
  NotificationJobData,
  InAppNotificationData,
  PushNotificationData,
  CombinedNotificationData,
  BulkPushNotificationData,
} from '@/infrastructure/queue/NotificationQueue';
import { getRedisCircuitBreaker } from '@/lib/circuit-breaker';
import { sendPushNotification, sendBulkPushNotifications } from '@/lib/push-notifications';
import { isMockRedis } from '@/lib/redis';
import { captureException } from '@/lib/sentry';
import { withTimeout, WORKER_TIMEOUTS } from '@/lib/with-timeout';

// ============================================================================
// Mock Worker for Development (when Redis is not available)
// ============================================================================

class MockNotificationWorker {
  async close(): Promise<void> {
    if (process.env.DEBUG_QUEUE) {
      console.log('[NotificationWorker] Mock worker stopped');
    }
  }

  on(_event: string, _listener: (...args: unknown[]) => void): void {
    // No-op
  }
}

// ============================================================================
// Notification Worker
// ============================================================================

export class NotificationWorker {
  private worker: Worker | MockNotificationWorker | null = null;
  private useMock: boolean;

  constructor() {
    this.useMock = isMockRedis();
    if (this.useMock) {
      this.initializeMockWorker();
    } else {
      this.initializeRealWorker();
    }
  }

  /**
   * Inicializa un worker mock para desarrollo sin Redis
   */
  private initializeMockWorker(): void {
    this.worker = new MockNotificationWorker();
    if (process.env.DEBUG_QUEUE) {
      console.log('[NotificationWorker] Running in mock mode (Redis not available)');
    }
  }

  /**
   * Inicializa el worker de notificaciones real con BullMQ
   */
  private initializeRealWorker(): void {
    if (isMockRedis()) {
      this.useMock = true;
      this.initializeMockWorker();
      return;
    }
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
      this.useMock = true;
      this.initializeMockWorker();
    }
  }

  /**
   * Configura los event handlers del worker
   */
  private setupEventHandlers(): void {
    if (!this.worker || this.useMock) return;

    const bullWorker = this.worker as Worker;

    bullWorker.on('completed', (job: Job) => {
      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_QUEUE) {
        const data = job.data as NotificationJobData;
        console.info(`[NotificationWorker] Job ${job.id} completed: ${data.type}`);
      }
    });

    bullWorker.on('failed', (job: Job | undefined, err: Error) => {
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

    bullWorker.on('error', (error: Error) => {
      console.error('[NotificationWorker] Worker error:', error.message);
      captureException(error, {
        extra: { queue: 'notifications' },
      });
    });

    bullWorker.on('stalled', (jobId: string) => {
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

    // In mock mode, just log instead of processing
    if (this.useMock) {
      if (process.env.DEBUG_QUEUE) {
        console.log('[NotificationWorker] MOCK job:', { type: data.type, userId: (data as any).userId });
      }
      return;
    }

    // Circuit breaker: si Redis está caído, degradar gracefulmente
    const breaker = getRedisCircuitBreaker();
    if (breaker.getState() !== 'CLOSED') {
      console.warn(`[NotificationWorker] Redis circuit open — skipping job ${job.id} (${data.type})`);
      return;
    }

    const timeout = this.getTimeoutForType(data.type);

    try {
      await withTimeout(this.processByType(data), timeout, `notification:${data.type}`);
      breaker.recordSuccess();
    } catch (error) {
      if (error instanceof Error && error.name !== 'TimeoutError') {
        breaker.recordFailure(error);
      }
      throw error;
    }
  }

  /**
   * Enruta el job al handler correspondiente
   */
  private async processByType(data: NotificationJobData): Promise<void> {
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
   * Obtiene el timeout apropiado según el tipo de notificación
   */
  private getTimeoutForType(type: string): number {
    switch (type) {
      case 'in-app':
        return WORKER_TIMEOUTS.NOTIFICATION_IN_APP;
      case 'push':
        return WORKER_TIMEOUTS.NOTIFICATION_PUSH;
      case 'in-app-with-push':
        return WORKER_TIMEOUTS.NOTIFICATION_COMBINED;
      case 'bulk-push':
        return WORKER_TIMEOUTS.NOTIFICATION_BULK_PUSH;
      default:
        return WORKER_TIMEOUTS.DEFAULT;
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

  get isMock(): boolean {
    return this.useMock;
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
