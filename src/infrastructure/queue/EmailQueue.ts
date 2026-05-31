/**
 * Cola de Emails para MangaAura
 * Gestiona el envío asíncrono de emails usando BullMQ
 * @packageDocumentation
 */

import { Queue, Job, type QueueOptions } from 'bullmq';

import { getBullConnection } from './connection';
import { InMemoryQueue } from './InMemoryQueue';
import type { WorkerMetrics } from './WorkerMetrics';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type EmailJobType =
  | 'welcome'
  | 'password-reset'
  | 'verification'
  | 'new-chapter'
  | 'achievement'
  | 'tip-received'
  | 'crowdfunding-goal-reached'
  | 'comment-reply'
  | 'level-up'
  | 'mention'
  | 'clan-invite'
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

export interface PasswordResetFields {
  to: string;
  userId: string;
  username: string;
  resetToken: string;
  resetLink: string;
  [key: string]: unknown;
}

export interface PasswordResetData extends EmailJobData, PasswordResetFields {
  type: 'password-reset';
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

export interface VerificationEmailData extends EmailJobData {
  type: 'verification';
  verificationUrl: string;
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

export interface LevelUpData extends EmailJobData {
  type: 'level-up';
  oldLevel: number;
  newLevel: number;
}

export interface MentionData extends EmailJobData {
  type: 'mention';
  mentionerUsername: string;
  commentContent: string;
  mangaTitle?: string;
  chapterId: string;
  commentId: string;
}

export interface ClanInviteData extends EmailJobData {
  type: 'clan-invite';
  clanId: string;
  clanName: string;
  clanSlug: string;
  inviterUsername: string;
}

export interface EmailJobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  /**
   * ID único para deduplicación.
   * Si ya existe un job con este ID en la cola, BullMQ no lo agrega de nuevo.
   */
  jobId?: string;
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

class InMemoryEmailQueue extends InMemoryQueue<EmailJobData> {
  constructor() {
    super('local');
  }

  override async add(name: string, data: EmailJobData, opts?: EmailJobOptions): Promise<Job> {
    const job = await super.add(name, data, opts);

    if (process.env.DEBUG_EMAIL) {
      console.log(`[EmailQueue] Job queued (in-memory): ${name} for ${data.to}`);
    }

    return job;
  }
}

// ============================================================================
// Email Queue
// ============================================================================

export class EmailQueue {
  private queue: Queue | InMemoryEmailQueue;
  private readonly queueName = 'emails';
  private useInMemory: boolean;

  constructor() {
    this.useInMemory = process.env.NODE_ENV !== 'production';

    if (this.useInMemory) {
      try {
        // Intenta crear InMemoryQueue — falla si no estamos en mock Redis
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { isMockRedis } = require('@/lib/redis');
        if (!isMockRedis()) {
          this.useInMemory = false;
          this.queue = this.initializeQueue();
          return;
        }
      } catch {
        // fall through
      }
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
      connection: getBullConnection(),
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
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
    const jobData = { ...data, type } as EmailJobData;

    const jobOptions = {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? {
        type: 'exponential' as const,
        delay: 2000,
      },
      jobId: options?.jobId,
    };

    try {
      const job = await this.queue.add(type, jobData, jobOptions);

      if (!this.useInMemory && process.env.NODE_ENV === 'production') {
        console.info(`[EmailQueue] Job added: ${type} for ${data.to} (Job ID: ${job.id})`);
      }

      return job as Job;
    } catch (error) {
      console.error(`[EmailQueue] Failed to add job ${type}:`, error);
      throw error;
    }
  }

  // ─── Email type methods ─────────────────────────────────────────

  async addWelcomeEmail(data: Omit<WelcomeEmailData, 'type'>): Promise<Job> {
    return this.addEmailJob('welcome', data, { priority: 2 });
  }

  async addPasswordResetEmail(data: PasswordResetFields): Promise<Job> {
    try {
      return await this.addEmailJob('password-reset', data, { priority: 1 });
    } catch (error) {
      console.warn('[EmailQueue] Queue unavailable, sending email directly');
      await this.sendPasswordResetEmailDirect(data);
      return {
        id: `direct-${Date.now()}`,
        name: 'password-reset',
        data: { ...data, type: 'password-reset' as const },
      } as unknown as Job;
    }
  }

  private async sendPasswordResetEmailDirect(data: PasswordResetFields): Promise<void> {
    try {
      const { emailService } = await import('@/infrastructure/adapters/emailService');
      await emailService.sendPasswordResetEmail(
        { id: data.userId, email: data.to, username: data.username },
        data.resetToken
      );
    } catch (error) {
      console.error('[EmailQueue] Failed to send password reset email directly:', error);
    }
  }

  async addVerificationEmail(data: Omit<VerificationEmailData, 'type'>): Promise<Job> {
    return this.addEmailJob('verification', data, { priority: 1 });
  }

  async addNewChapterEmail(data: Omit<NewChapterData, 'type'>): Promise<Job> {
    return this.addEmailJob('new-chapter', data, {
      priority: 3,
      delay: 5 * 60 * 1000,
    });
  }

  async addAchievementEmail(data: Omit<AchievementData, 'type'>): Promise<Job> {
    return this.addEmailJob('achievement', data, { priority: 2 });
  }

  async addTipReceivedEmail(data: Omit<TipReceivedData, 'type'>): Promise<Job> {
    return this.addEmailJob('tip-received', data, { priority: 2 });
  }

  async addCrowdfundingGoalEmail(data: Omit<CrowdfundingGoalData, 'type'>): Promise<Job> {
    return this.addEmailJob('crowdfunding-goal-reached', data, { priority: 2 });
  }

  async addCommentReplyEmail(data: Omit<CommentReplyData, 'type'>): Promise<Job> {
    return this.addEmailJob('comment-reply', data, { priority: 3 });
  }

  /** Email de subida de nivel */
  async addLevelUpEmail(data: Omit<LevelUpData, 'type'>): Promise<Job> {
    return this.addEmailJob('level-up', data, { priority: 2 });
  }

  /** Email de mención */
  async addMentionEmail(data: Omit<MentionData, 'type'>): Promise<Job> {
    return this.addEmailJob('mention', data, { priority: 3 });
  }

  /** Email de invitación a clan */
  async addClanInviteEmail(data: Omit<ClanInviteData, 'type'>): Promise<Job> {
    return this.addEmailJob('clan-invite', data, { priority: 2 });
  }

  // ─── Stats ─────────────────────────────────────────────────────

  async getStats(): Promise<QueueStats> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryEmailQueue;
        return {
          waiting: await inMem.getWaitingCount(),
          active: await inMem.getActiveCount(),
          completed: await inMem.getCompletedCount(),
          failed: await inMem.getFailedCount(),
          delayed: await inMem.getDelayedCount(),
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

  async getJobs(state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'): Promise<Job[]> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryEmailQueue;
        switch (state) {
          case 'waiting': return inMem.getWaiting();
          case 'active': return inMem.getActive();
          case 'completed': return inMem.getCompleted();
          case 'failed': return inMem.getFailed();
          case 'delayed': return inMem.getDelayed();
          default: return [];
        }
      }
      const bullQueue = this.queue as Queue;
      switch (state) {
        case 'waiting': return bullQueue.getWaiting();
        case 'active': return bullQueue.getActive();
        case 'completed': return bullQueue.getCompleted();
        case 'failed': return bullQueue.getFailed();
        case 'delayed': return bullQueue.getDelayed();
        default: return [];
      }
    } catch (error) {
      console.error('[EmailQueue] Failed to get jobs:', error);
      return [];
    }
  }

  // ─── Worker Metrics ────────────────────────────────────────────

  async getWorkerMetrics(): Promise<WorkerMetrics> {
    try {
      if (this.useInMemory) {
        return {
          failureRate: 0,
          avgProcessingTime: 0,
          jobsCompleted: 0,
          jobsFailed: 0,
          throughput1h: 0,
          byType: {},
        };
      }

      const bullQueue = this.queue as Queue;
      const [completedJobs, failedJobs] = await Promise.all([
        bullQueue.getJobs(['completed'], 0, 200),
        bullQueue.getJobs(['failed'], 0, 100),
      ]);

      const now = Date.now();
      const oneHourAgo = now - 3600_000;

      const jobsCompleted = completedJobs.length;
      const jobsFailed = failedJobs.length;
      const totalJobs = jobsCompleted + jobsFailed;
      const failureRate = totalJobs > 0 ? (jobsFailed / totalJobs) * 100 : 0;

      // Average processing time
      let totalProcessingTime = 0;
      let processedWithTime = 0;
      let throughput1h = 0;

      const byType: Record<string, { completed: number; failed: number; avgProcessingTime: number }> = {};

      for (const job of completedJobs) {
        const typeName = job.name || 'unknown';
        if (!byType[typeName]) byType[typeName] = { completed: 0, failed: 0, avgProcessingTime: 0 };
        byType[typeName].completed++;

        if (job.finishedOn && job.processedOn) {
          const duration = job.finishedOn - job.processedOn;
          totalProcessingTime += duration;
          processedWithTime++;
          // Track by-type avg (running sum, will divide later)
          byType[typeName].avgProcessingTime += duration;
        }

        // Count jobs completed in last hour
        if (job.finishedOn && job.finishedOn > oneHourAgo) {
          throughput1h++;
        }
      }

      for (const job of failedJobs) {
        const typeName = job.name || 'unknown';
        if (!byType[typeName]) byType[typeName] = { completed: 0, failed: 0, avgProcessingTime: 0 };
        byType[typeName].failed++;

        // Include failed job durations too if available
        if (job.finishedOn && job.processedOn) {
          const duration = job.finishedOn - job.processedOn;
          totalProcessingTime += duration;
          processedWithTime++;
          byType[typeName].avgProcessingTime += duration;
        }
      }

      // Divide running sums to get averages
      for (const key of Object.keys(byType)) {
        const type = byType[key];
        const typeTotal = type.completed + type.failed;
        if (typeTotal > 0) {
          type.avgProcessingTime = Math.round(type.avgProcessingTime / typeTotal);
        }
      }

      const avgProcessingTime = processedWithTime > 0
        ? Math.round(totalProcessingTime / processedWithTime)
        : 0;

      return {
        failureRate: Math.round(failureRate * 10) / 10,
        avgProcessingTime,
        jobsCompleted,
        jobsFailed,
        throughput1h,
        byType,
      };
    } catch (error) {
      console.error('[EmailQueue] Failed to get worker metrics:', error);
      return {
        failureRate: 0,
        avgProcessingTime: 0,
        jobsCompleted: 0,
        jobsFailed: 0,
        throughput1h: 0,
        byType: {},
      };
    }
  }

  async cleanOldJobs(olderThanHours: number = 24): Promise<void> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryEmailQueue;
        await inMem.clean(olderThanHours * 60 * 60 * 1000, 'completed');
        await inMem.clean(olderThanHours * 60 * 60 * 1000, 'failed');
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

  async pause(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).pause();
      }
      console.info('[EmailQueue] Queue paused');
    } catch (error) {
      console.error('[EmailQueue] Failed to pause:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).resume();
      }
      console.info('[EmailQueue] Queue resumed');
    } catch (error) {
      console.error('[EmailQueue] Failed to resume:', error);
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
          console.warn(`[EmailQueue] Failed to retry job ${job.id}:`, e);
        }
      }
      if (retried > 0) {
        console.info(`[EmailQueue] Retried ${retried}/${failedJobs.length} failed jobs`);
      }
      return retried;
    } catch (error) {
      console.error('[EmailQueue] Failed to retry jobs:', error);
      return 0;
    }
  }

  get name(): string {
    return this.queueName;
  }

  async close(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).close();
      } else {
        await (this.queue as InMemoryEmailQueue).close();
      }
    } catch (error) {
      console.error('[EmailQueue] Failed to close:', error);
    }
  }

  get isMock(): boolean {
    return this.useInMemory;
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
