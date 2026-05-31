import { Queue, Job, type QueueOptions } from 'bullmq'

import { getBullConnection } from './connection'
import { InMemoryQueue } from './InMemoryQueue'
import type { WorkerMetrics } from './WorkerMetrics'
import type { InboundEmailData, EmailClassification } from '@/core/services/IInboundEmailRepository'

export type InboundJobType = 'classify' | 'process' | 'reply'

export interface InboundEmailJobData {
  type: InboundJobType
  email: InboundEmailData
  classification?: EmailClassification
}

interface JobCallbacks {
  onComplete?: (jobId: string) => void
  onFailed?: (jobId: string, error: Error) => void
}

class InMemoryInboundQueue extends InMemoryQueue<InboundEmailJobData> {
  constructor() {
    super('inbound')
  }

  override async add(name: string, data: InboundEmailJobData, opts?: unknown): Promise<Job> {
    const job = await super.add(name, data, opts)

    if (process.env.DEBUG_EMAIL) {
      console.log(`[InboundQueue] Job queued (in-memory): ${name} from ${data.email.fromEmail}`)
    }

    return job
  }
}

export class InboundEmailQueue {
  private queue: Queue | InMemoryInboundQueue
  private readonly queueName = 'inbound-emails'
  private useInMemory: boolean

  constructor() {
    this.useInMemory = process.env.NODE_ENV !== 'production'

    if (this.useInMemory) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { isMockRedis } = require('@/lib/redis')
        if (!isMockRedis()) {
          this.useInMemory = false
          this.queue = this.initializeQueue()
          return
        }
      } catch {
        // fall through
      }
      this.queue = new InMemoryInboundQueue()
    } else {
      this.queue = this.initializeQueue()
    }
  }

  private initializeQueue(): Queue {
    const options: QueueOptions = {
      connection: getBullConnection(),
      defaultJobOptions: {
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    }
    return new Queue(this.queueName, options)
  }

  async addClassifyJob(email: InboundEmailData, callbacks?: JobCallbacks): Promise<Job> {
    return this.addJob('classify', { type: 'classify', email }, callbacks)
  }

  async addProcessJob(email: InboundEmailData, classification: EmailClassification): Promise<Job> {
    return this.addJob('process', { type: 'process', email, classification })
  }

  private async addJob(type: InboundJobType, data: InboundEmailJobData, _callbacks?: JobCallbacks, jobId?: string): Promise<Job> {
    try {
      return await this.queue.add(type, data, jobId ? { jobId } : undefined) as Job
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error
      console.log(`[InboundQueue] Job would be added (queue unavailable): ${type}`)
      return { id: 'mock-job', name: type, data, opts: {} } as unknown as Job
    }
  }

  async getStats(): Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryInboundQueue
        return {
          waiting: await inMem.getWaitingCount(),
          active: await inMem.getActiveCount(),
          completed: await inMem.getCompletedCount(),
          failed: await inMem.getFailedCount(),
          delayed: await inMem.getDelayedCount(),
        }
      }
      const bullQueue = this.queue as Queue
      const counts = await bullQueue.getJobCounts()
      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      }
    } catch (error) {
      console.error('[InboundEmailQueue] Failed to get stats:', error)
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    }
  }

  // ─── Worker Metrics ────────────────────────────────────────────

  async getWorkerMetrics(): Promise<WorkerMetrics> {
    try {
      if (this.useInMemory) {
        return { failureRate: 0, avgProcessingTime: 0, jobsCompleted: 0, jobsFailed: 0, throughput1h: 0, byType: {} };
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
          byType[typeName].avgProcessingTime += duration;
        }

        if (job.finishedOn && job.finishedOn > oneHourAgo) {
          throughput1h++;
        }
      }

      for (const job of failedJobs) {
        const typeName = job.name || 'unknown';
        if (!byType[typeName]) byType[typeName] = { completed: 0, failed: 0, avgProcessingTime: 0 };
        byType[typeName].failed++;

        if (job.finishedOn && job.processedOn) {
          totalProcessingTime += job.finishedOn - job.processedOn;
          processedWithTime++;
          byType[typeName].avgProcessingTime += job.finishedOn - job.processedOn;
        }
      }

      for (const key of Object.keys(byType)) {
        const type = byType[key];
        const typeTotal = type.completed + type.failed;
        if (typeTotal > 0) {
          type.avgProcessingTime = Math.round(type.avgProcessingTime / typeTotal);
        }
      }

      return {
        failureRate: Math.round(failureRate * 10) / 10,
        avgProcessingTime: processedWithTime > 0 ? Math.round(totalProcessingTime / processedWithTime) : 0,
        jobsCompleted,
        jobsFailed,
        throughput1h,
        byType,
      };
    } catch (error) {
      console.error('[InboundEmailQueue] Failed to get worker metrics:', error);
      return { failureRate: 0, avgProcessingTime: 0, jobsCompleted: 0, jobsFailed: 0, throughput1h: 0, byType: {} };
    }
  }

  async clean(olderThanHours: number = 24): Promise<void> {
    try {
      if (this.useInMemory) return
      const bullQueue = this.queue as Queue
      const olderThanMs = olderThanHours * 60 * 60 * 1000
      await Promise.all([
        bullQueue.clean(olderThanMs, 500, 'completed'),
        bullQueue.clean(olderThanMs, 200, 'failed'),
      ])
      console.info(`[InboundEmailQueue] Cleaned jobs older than ${olderThanHours}h`)
    } catch (error) {
      console.error('[InboundEmailQueue] Failed to clean:', error)
    }
  }

  async pause(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).pause()
      }
      console.info('[InboundEmailQueue] Queue paused')
    } catch (error) {
      console.error('[InboundEmailQueue] Failed to pause:', error)
    }
  }

  async resume(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).resume()
      }
      console.info('[InboundEmailQueue] Queue resumed')
    } catch (error) {
      console.error('[InboundEmailQueue] Failed to resume:', error)
    }
  }

  get name(): string {
    return this.queueName
  }

  async close(): Promise<void> {
    if (!this.useInMemory) {
      await (this.queue as Queue).close()
    }
  }
}

let globalQueue: InboundEmailQueue | null = null

export function getInboundEmailQueue(): InboundEmailQueue {
  if (!globalQueue) globalQueue = new InboundEmailQueue()
  return globalQueue
}

export function resetInboundEmailQueue(): void {
  globalQueue?.close()
  globalQueue = null
}
