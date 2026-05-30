/**
 * Notification Queue for MangaAura
 * Procesa notificaciones in-app y push notifications de forma asíncrona usando BullMQ.
 *
 * @packageDocumentation
 */

import { Queue, Job, type QueueOptions } from 'bullmq';

import { getBullConnection } from './connection';
import { isMockRedis } from '@/lib/redis';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type NotificationJobType =
  | 'in-app'
  | 'push'
  | 'in-app-with-push'
  | 'bulk-push';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export interface InAppNotificationData {
  type: 'in-app';
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  linkUrl?: string;
}

export interface PushNotificationData {
  type: 'push';
  userId: string;
  payload: NotificationPayload;
}

export interface CombinedNotificationData {
  type: 'in-app-with-push';
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  linkUrl?: string;
  pushPayload: NotificationPayload;
}

export interface BulkPushNotificationData {
  type: 'bulk-push';
  userIds: string[];
  payload: NotificationPayload;
}

export type NotificationJobData =
  | InAppNotificationData
  | PushNotificationData
  | CombinedNotificationData
  | BulkPushNotificationData;

export interface NotificationQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// ============================================================================
// In-Memory Queue for Development (Mock)
// ============================================================================

class InMemoryNotificationQueue {
  private jobs: Map<string, { data: NotificationJobData; addedAt: Date }> = new Map();
  private jobCounter = 0;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV !== 'production' && isMockRedis();
  }

  async add(name: string, data: NotificationJobData, _opts?: unknown): Promise<Job> {
    if (!this.isEnabled) throw new Error('In-memory queue not enabled');

    this.jobCounter++;
    const id = `notif-local-${this.jobCounter}`;
    const jobData = { data, addedAt: new Date() };
    this.jobs.set(id, jobData);

    if (process.env.DEBUG_QUEUE) {
      console.log(`[NotificationQueue] Job queued (in-memory): ${name} for user ${data.type === 'bulk-push' ? 'multiple' : (data as any).userId}`);
    }

    return {
      id,
      name,
      data,
      opts: {},
      returnvalue: null,
      failedReason: null,
      stacktrace: null,
      attemptsMade: 0,
      delay: 0,
      progress: 0,
      timestamp: Date.now(),
      finishedOn: undefined,
      processedOn: undefined,
      getState: async () => 'completed',
      retry: async () => {},
      discard: async () => { this.jobs.delete(id); },
      moveToCompleted: async () => {},
      moveToFailed: async () => {},
      changeDelay: async () => {},
      changePriority: async () => {},
      toJSON: () => ({ id, name, data }),
      remove: async () => { this.jobs.delete(id); },
      log: async () => {},
    } as unknown as Job;
  }

  async getJobCounts(): Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }> {
    return { waiting: this.jobs.size, active: 0, completed: 0, failed: 0, delayed: 0 };
  }

  async getJobs(_types?: string[]): Promise<Job[]> {
    return [];
  }

  async clean(_ms: number, _limit: number | string, _type?: string): Promise<void> {
    // No-op
  }

  async close(): Promise<void> {
    this.jobs.clear();
  }
}

// ============================================================================
// Notification Queue
// ============================================================================

export class NotificationQueue {
  private queue: Queue | InMemoryNotificationQueue;
  private readonly queueName = 'notifications';
  private useInMemory: boolean;

  constructor() {
    this.useInMemory = process.env.NODE_ENV !== 'production' && isMockRedis();

    if (this.useInMemory) {
      this.queue = new InMemoryNotificationQueue();
      if (process.env.DEBUG_QUEUE) {
        console.log('[NotificationQueue] Using in-memory queue (Redis not available)');
      }
    } else {
      this.queue = this.initializeQueue();
    }
  }

  private initializeQueue(): Queue {
    const connection = getBullConnection();
    const options: QueueOptions = {
      connection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600,
          count: 500,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
          count: 200,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    return new Queue(this.queueName, options);
  }

  /**
   * Crea una notificación in-app en background
   */
  async addInAppNotification(data: Omit<InAppNotificationData, 'type'>): Promise<Job> {
    return this.addJob({ ...data, type: 'in-app' });
  }

  /**
   * Envía una push notification en background
   */
  async addPushNotification(data: Omit<PushNotificationData, 'type'>): Promise<Job> {
    return this.addJob({ ...data, type: 'push' });
  }

  /**
   * Crea notificación in-app + push en un solo job
   */
  async addCombinedNotification(data: Omit<CombinedNotificationData, 'type'>): Promise<Job> {
    return this.addJob({ ...data, type: 'in-app-with-push' }, { priority: 2 });
  }

  /**
   * Envía push notifications a múltiples usuarios
   */
  async addBulkPushNotification(data: Omit<BulkPushNotificationData, 'type'>): Promise<Job> {
    return this.addJob({ ...data, type: 'bulk-push' }, { priority: 3 });
  }

  /**
   * Agrega un job a la cola de notificaciones
   */
  private async addJob(
    data: NotificationJobData,
    opts?: { delay?: number; priority?: number },
  ): Promise<Job> {
    if (this.useInMemory) {
      const inMem = this.queue as InMemoryNotificationQueue;
      return inMem.add(data.type, data, opts);
    }

    const bullQueue = this.queue as Queue;
    const job = await bullQueue.add(data.type, data, {
      delay: opts?.delay,
      priority: opts?.priority,
    });

    if (process.env.NODE_ENV === 'production' || process.env.DEBUG_QUEUE) {
      console.info(`[NotificationQueue] Job added: ${data.type} for user ${(data as any).userId} (Job ID: ${job.id})`);
    }

    return job;
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getStats(): Promise<NotificationQueueStats> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryNotificationQueue;
        const counts = await inMem.getJobCounts();
        return {
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
        };
      }
      const bullQueue = this.queue as Queue;
      const counts = await bullQueue.getJobCounts();
      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      };
    } catch (error) {
      console.error('[NotificationQueue] Failed to get stats:', error);
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  async getJobs(state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'): Promise<Job[]> {
    try {
      if (this.useInMemory) {
        return [];
      }
      const bullQueue = this.queue as Queue;
      return await bullQueue.getJobs([state]);
    } catch (error) {
      console.error('[NotificationQueue] Failed to get jobs:', error);
      return [];
    }
  }

  async clean(olderThanHours = 24): Promise<void> {
    try {
      if (this.useInMemory) return;
      const bullQueue = this.queue as Queue;
      const olderThanMs = olderThanHours * 60 * 60 * 1000;
      await Promise.all([
        bullQueue.clean(olderThanMs, 500, 'completed'),
        bullQueue.clean(olderThanMs, 200, 'failed'),
      ]);
      console.info(`[NotificationQueue] Cleaned jobs older than ${olderThanHours}h`);
    } catch (error) {
      console.error('[NotificationQueue] Failed to clean:', error);
    }
  }

  async pause(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).pause();
      }
      console.info('[NotificationQueue] Queue paused');
    } catch (error) {
      console.error('[NotificationQueue] Failed to pause:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).resume();
      }
      console.info('[NotificationQueue] Queue resumed');
    } catch (error) {
      console.error('[NotificationQueue] Failed to resume:', error);
    }
  }

  async retryFailed(limit = 50): Promise<number> {
    try {
      if (this.useInMemory) return 0;
      const bullQueue = this.queue as Queue;
      const failedJobs = await bullQueue.getJobs(['failed'], 0, limit);
      let retried = 0;
      for (const job of failedJobs) {
        try {
          await job.retry();
          retried++;
        } catch (e) {
          console.warn(`[NotificationQueue] Failed to retry job ${job.id}:`, e);
        }
      }
      if (retried > 0) {
        console.info(`[NotificationQueue] Retried ${retried}/${failedJobs.length} failed jobs`);
      }
      return retried;
    } catch (error) {
      console.error('[NotificationQueue] Failed to retry jobs:', error);
      return 0;
    }
  }

  async close(): Promise<void> {
    if (this.useInMemory) {
      const inMem = this.queue as InMemoryNotificationQueue;
      await inMem.close();
    } else {
      const bullQueue = this.queue as Queue;
      await bullQueue.close();
    }
  }

  get name(): string {
    return this.queueName;
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let globalQueue: NotificationQueue | null = null;

export function getNotificationQueue(): NotificationQueue {
  if (!globalQueue) {
    globalQueue = new NotificationQueue();
  }
  return globalQueue;
}

export function resetNotificationQueue(): void {
  globalQueue?.close();
  globalQueue = null;
}

export default NotificationQueue;
