import { Queue, Job, type QueueOptions } from 'bullmq'

import type { InboundEmailData, EmailClassification } from '@/core/services/IInboundEmailRepository'
import { getBullConnection } from './connection'
import { isMockRedis } from '@/lib/redis'

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

class InMemoryInboundQueue {
  private jobs: Map<string, { data: InboundEmailJobData; addedAt: Date }> = new Map()
  private jobCounter = 0
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV !== 'production' && isMockRedis()
  }

  async add(name: string, data: InboundEmailJobData): Promise<Job> {
    if (!this.isEnabled) throw new Error('In-memory queue not enabled')

    this.jobCounter++
    const id = `inbound-${this.jobCounter}`
    this.jobs.set(id, { data, addedAt: new Date() })

    if (process.env.DEBUG_EMAIL) {
      console.log(`[InboundQueue] Job queued (in-memory): ${name} from ${data.email.fromEmail}`)
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
      discard: async () => { this.jobs.delete(id) },
      moveToCompleted: async () => {},
      moveToFailed: async () => {},
      changeDelay: async () => {},
      changePriority: async () => {},
      toJSON: () => ({ id, name, data, opts: {} }),
      remove: async () => { this.jobs.delete(id) },
      log: async () => {},
    } as unknown as Job
  }

  async getWaitingCount(): Promise<number> { return this.jobs.size }
  async getActiveCount(): Promise<number> { return 0 }
  async getCompletedCount(): Promise<number> { return 0 }
  async getFailedCount(): Promise<number> { return 0 }
  async getDelayedCount(): Promise<number> { return 0 }
  async close(): Promise<void> { this.jobs.clear() }
}

export class InboundEmailQueue {
  private queue: Queue | InMemoryInboundQueue
  private readonly queueName = 'inbound-emails'
  private useInMemory: boolean

  constructor() {
    this.useInMemory = process.env.NODE_ENV !== 'production' && isMockRedis()

    if (this.useInMemory) {
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

  private async addJob(type: InboundJobType, data: InboundEmailJobData, _callbacks?: JobCallbacks): Promise<Job> {
    try {
      return await this.queue.add(type, data) as Job
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
