/**
 * Cola de Emails para InkVerse
 * Gestiona el envío asíncrono de emails usando BullMQ
 * @packageDocumentation
 */

import { Queue, Job, type QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { redis, isMockRedis } from '@/lib/redis';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type EmailJobType =
  | 'welcome'
  | 'password-reset'
  | 'new-chapter'
  | 'achievement'
  | 'tip-received'
  | 'crowdfunding-goal-reached'
  | 'comment-reply'
  | 'marketing'
  | 'custom';

export interface EmailJobData {
  type: EmailJobType;
  to: string;
  userId: string;
  username: string;
  [key: string]: unknown;
}

export interface WelcomeEmailData extends EmailJobData {
  type: 'welcome';
  displayName?: string;
}

export interface PasswordResetData extends EmailJobData {
  type: 'password-reset';
  resetToken: string;
  resetLink: string;
}

export interface NewChapterData extends EmailJobData {
  type: 'new-chapter';
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  mangaCoverUrl?: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string;
}

export interface AchievementData extends EmailJobData {
  type: 'achievement';
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  achievementIconUrl?: string;
  xpReward: number;
}

export interface TipReceivedData extends EmailJobData {
  type: 'tip-received';
  tipId: string;
  amount: number;
  message?: string;
  fromUserId: string;
  fromUsername: string;
}

export interface CrowdfundingGoalData extends EmailJobData {
  type: 'crowdfunding-goal-reached';
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string;
}

export interface CommentReplyData extends EmailJobData {
  type: 'comment-reply';
  commentId: string;
  replyContent: string;
  replierUsername: string;
  chapterId: string;
  chapterNumber: number;
  mangaTitle: string;
}

export interface EmailJobOptions {
  delay?: number; // Delay en milisegundos
  priority?: number; // Prioridad (1 = más alta)
  attempts?: number; // Intentos de reenvío
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// ============================================================================
// In-Memory Queue for Development (Mock)
// ============================================================================

class InMemoryEmailQueue {
  private jobs: Map<string, { data: EmailJobData; options: EmailJobOptions; addedAt: Date }> = new Map();
  private jobCounter = 0;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV !== 'production' && isMockRedis();
  }

  async add(name: string, data: EmailJobData, opts?: EmailJobOptions): Promise<Job> {
    if (!this.isEnabled) {
      throw new Error('In-memory queue not enabled');
    }

    this.jobCounter++;
    const id = `local-${this.jobCounter}`;
    const jobData = { data, options: opts || {}, addedAt: new Date() };
    this.jobs.set(id, jobData);

    // Log in development only
    if (process.env.DEBUG_EMAIL) {
    console.log(`[EmailQueue] Job queued (in-memory): ${name} for ${data.to}`);
  }

  // Return a mock Job object
  return {
    id,
    name,
    data,
    opts: opts || {},
    returnvalue: null,
    failedReason: null,
    stacktrace: null,
    attemptsMade: 0,
    delay: opts?.delay || 0,
    progress: 0,
    timestamp: Date.now(),
    finishedOn: undefined,
    processedOn: undefined,
    getState: async () => 'completed',
    retry: async () => this.retry(id),
    discard: async () => { this.jobs.delete(id); },
    moveToCompleted: async () => { },
    moveToFailed: async () => { },
    changeDelay: async () => { },
    changePriority: async () => { },
    toJSON: () => ({
      id,
      name,
      data,
      opts: opts || {},
    }),
      remove: async () => { this.jobs.delete(id); },
      log: async () => { },
    } as unknown as Job;
  }

  async getWaitingCount(): Promise<number> {
    return this.jobs.size;
  }

  async getActiveCount(): Promise<number> {
    return 0; // In-memory queue doesn't track active
  }

  async getCompletedCount(): Promise<number> {
    return 0;
  }

  async getFailedCount(): Promise<number> {
    return 0;
  }

  async getDelayedCount(): Promise<number> {
    return 0;
  }

  async getWaiting(): Promise<Job[]> {
    return [];
  }

  async getActive(): Promise<Job[]> {
    return [];
  }

  async getCompleted(): Promise<Job[]> {
    return [];
  }

  async getFailed(): Promise<Job[]> {
    return [];
  }

  async getDelayed(): Promise<Job[]> {
    return [];
  }

  async clean(_ms: number, _state: string): Promise<void> {
    // No-op for in-memory
  }

  async pause(): Promise<void> {
    // No-op
  }

  async resume(): Promise<void> {
    // No-op
  }

  async close(): Promise<void> {
    this.jobs.clear();
  }

  private async retry(_id: string): Promise<void> {
    // No-op retry for in-memory
  }
}

// ============================================================================
// Email Queue
// ============================================================================

export class EmailQueue {
  private queue: Queue | InMemoryEmailQueue;
  private redisConnection: Redis;
  private readonly queueName = 'emails';
  private useInMemory: boolean;

  constructor() {
    this.redisConnection = redis as Redis;
    this.useInMemory = process.env.NODE_ENV !== 'production' && isMockRedis();

    if (this.useInMemory) {
      this.queue = new InMemoryEmailQueue();
      if (process.env.DEBUG_EMAIL) {
        console.log('[EmailQueue] Using in-memory queue (Redis not available)');
      }
    } else {
      this.queue = this.initializeQueue();
    }
  }

  /**
   * Inicializa la cola de emails
   */
  private initializeQueue(): Queue {
    const options: QueueOptions = {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600, // Mantener completados por 24 horas
          count: 1000, // Máximo 1000 jobs completados
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Mantener fallidos por 7 días
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
   * Agrega un job a la cola de emails
   */
  async addEmailJob(
    type: EmailJobType,
    data: Omit<EmailJobData, 'type'>,
    options?: EmailJobOptions
  ): Promise<Job> {
const jobData: EmailJobData = {
...data,
type,
} as EmailJobData;

    const jobOptions = {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? {
        type: 'exponential' as const,
        delay: 2000,
      },
    };

    try {
      const job = await this.queue.add(type, jobData, jobOptions);

      if (!this.useInMemory) {
        console.info(`[EmailQueue] Job added: ${type} for ${data.to} (Job ID: ${job.id})`);
      }

return job as Job;
    } catch (error) {
      // If queue fails and we're in production, this is an error
      if (process.env.NODE_ENV === 'production') {
        console.error('[EmailQueue] Failed to add job:', error);
        throw error;
      }

      // In development, just log and return a mock job
      console.log(`[EmailQueue] Job would be added (queue unavailable): ${type} for ${data.to}`);
      return {
        id: 'mock-job',
        name: type,
        data: jobData,
        opts: jobOptions,
      } as unknown as Job;
    }
  }

  /**
   * Agrega email de bienvenida a la cola
   */
  async addWelcomeEmail(data: Omit<WelcomeEmailData, 'type'>): Promise<Job> {
    return this.addEmailJob('welcome', data, {
      priority: 2, // Prioridad alta
    });
  }

  /**
   * Agrega email de recuperación de contraseña a la cola
   */
  async addPasswordResetEmail(data: Omit<PasswordResetData, 'type'>): Promise<Job> {
    return this.addEmailJob('password-reset', data, {
      priority: 1, // Máxima prioridad
    });
  }

  /**
   * Agrega notificación de nuevo capítulo a la cola
   */
  async addNewChapterEmail(data: Omit<NewChapterData, 'type'>): Promise<Job> {
    return this.addEmailJob('new-chapter', data, {
      priority: 3, // Prioridad normal
      delay: 5 * 60 * 1000, // Delay de 5 minutos para batch processing
    });
  }

  /**
   * Agrega notificación de logro desbloqueado a la cola
   */
  async addAchievementEmail(data: Omit<AchievementData, 'type'>): Promise<Job> {
    return this.addEmailJob('achievement', data, {
      priority: 2, // Prioridad alta
    });
  }

  /**
   * Agrega notificación de propina recibida a la cola
   */
  async addTipReceivedEmail(data: Omit<TipReceivedData, 'type'>): Promise<Job> {
    return this.addEmailJob('tip-received', data, {
      priority: 2, // Prioridad alta
    });
  }

  /**
   * Agrega notificación de meta de crowdfunding alcanzada a la cola
   */
  async addCrowdfundingGoalEmail(data: Omit<CrowdfundingGoalData, 'type'>): Promise<Job> {
    return this.addEmailJob('crowdfunding-goal-reached', data, {
      priority: 2, // Prioridad alta
    });
  }

  /**
   * Agrega notificación de respuesta a comentario a la cola
   */
  async addCommentReplyEmail(data: Omit<CommentReplyData, 'type'>): Promise<Job> {
    return this.addEmailJob('comment-reply', data, {
      priority: 3, // Prioridad normal
    });
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getStats(): Promise<QueueStats> {
    try {
      if (this.useInMemory) {
        const inMemory = this.queue as InMemoryEmailQueue;
        return {
          waiting: await inMemory.getWaitingCount(),
          active: await inMemory.getActiveCount(),
          completed: await inMemory.getCompletedCount(),
          failed: await inMemory.getFailedCount(),
          delayed: await inMemory.getDelayedCount(),
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
      console.error('[EmailQueue] Failed to get stats:', error);
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  /**
   * Obtiene jobs por estado
   */
  async getJobs(state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'): Promise<Job[]> {
    try {
      if (this.useInMemory) {
        const inMemory = this.queue as InMemoryEmailQueue;
        switch (state) {
          case 'waiting': return inMemory.getWaiting();
          case 'active': return inMemory.getActive();
          case 'completed': return inMemory.getCompleted();
          case 'failed': return inMemory.getFailed();
          case 'delayed': return inMemory.getDelayed();
          default: return [];
        }
      }

  const bullQueue = this.queue as Queue;
  switch (state) {
  case 'waiting':
  return bullQueue.getWaiting();
  case 'active':
  return bullQueue.getActive();
  case 'completed':
  return bullQueue.getCompleted();
  case 'failed':
  return bullQueue.getFailed();
  case 'delayed':
  return bullQueue.getDelayed();
  default:
  return [];
  }
    } catch (error) {
      console.error('[EmailQueue] Failed to get jobs:', error);
      return [];
    }
  }

  /**
   * Limpia jobs completados y fallidos antiguos
   */
  async cleanOldJobs(olderThanHours: number = 24): Promise<void> {
    try {
      if (this.useInMemory) {
        const inMemory = this.queue as InMemoryEmailQueue;
        await inMemory.clean(olderThanHours * 60 * 60 * 1000, 'completed');
        await inMemory.clean(olderThanHours * 60 * 60 * 1000, 'failed');
      } else {
  const bullQueue = this.queue as Queue;
  const olderThanMs = olderThanHours * 60 * 60 * 1000;

  await Promise.all([
  bullQueue.clean(olderThanMs, 1000, 'completed'),
  bullQueue.clean(olderThanMs, 1000, 'failed'),
  ]);
      }

      console.info(`[EmailQueue] Cleaned jobs older than ${olderThanHours} hours`);
    } catch (error) {
      console.error('[EmailQueue] Failed to clean old jobs:', error);
    }
  }

  /**
   * Pausa la cola
   */
  async pause(): Promise<void> {
    try {
  if (!this.useInMemory) {
  const bullQueue = this.queue as Queue;
  await bullQueue.pause();
  }
      console.info('[EmailQueue] Queue paused');
    } catch (error) {
      console.error('[EmailQueue] Failed to pause:', error);
    }
  }

  /**
   * Reanuda la cola
   */
  async resume(): Promise<void> {
    try {
  if (!this.useInMemory) {
  const bullQueue = this.queue as Queue;
  await bullQueue.resume();
  }
      console.info('[EmailQueue] Queue resumed');
    } catch (error) {
      console.error('[EmailQueue] Failed to resume:', error);
    }
  }

  /**
   * Obtiene el nombre de la cola
   */
  get name(): string {
    return this.queueName;
  }

  /**
   * Cierra la conexión de la cola
   */
  async close(): Promise<void> {
    try {
  if (!this.useInMemory) {
  const bullQueue = this.queue as Queue;
  await bullQueue.close();
  }
    } catch (error) {
      console.error('[EmailQueue] Failed to close:', error);
    }
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let globalQueue: EmailQueue | null = null;

export function getEmailQueue(): EmailQueue {
  if (!globalQueue) {
    globalQueue = new EmailQueue();
  }
  return globalQueue;
}

export function resetEmailQueue(): void {
  globalQueue?.close();
  globalQueue = null;
}

export default EmailQueue;
