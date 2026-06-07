/**
 * Cola de Generación de Imágenes con IA
 *
 * Gestiona las generaciones de imágenes de forma asíncrona usando BullMQ.
 * Permite encolar solicitudes y procesarlas en background sin bloquear al usuario.
 *
 * @packageDocumentation
 */

import { Queue, Job, type QueueOptions } from 'bullmq';

import { getBullConnection } from './connection';
import { InMemoryQueue } from './InMemoryQueue';

// ============================================================================
// Types
// ============================================================================

export interface ImageGenerationJobData {
  generationId: string;
  userId: string;
  prompt: string;
  negativePrompt?: string | null;
  modelId: string;
  width?: number;
  height?: number;
  quality?: string;
  style?: string;
  seed?: number | null;
  auraCost: number;
  modelName: string;
}

export interface ImageGenerationJobResult {
  imageUrl: string;
  thumbnailUrl: string | null;
  seed: number | null;
  auraCost: number;
  modelName: string;
  provider: string;
  status: 'COMPLETED' | 'FAILED';
  error?: string;
  auraRefunded?: number;
}

export interface ImageGenerationJobOptions {
  delay?: number;
  priority?: number;
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

class InMemoryImageGenerationQueue extends InMemoryQueue<ImageGenerationJobData> {
  constructor() {
    super('img-gen');
  }

  override async add(name: string, data: ImageGenerationJobData, _opts?: unknown): Promise<Job> {
    const job = await super.add(name, data, _opts);
    return job;
  }
}

// ============================================================================
// Image Generation Queue
// ============================================================================

export class ImageGenerationQueue {
  private queue: Queue | InMemoryImageGenerationQueue;
  private readonly queueName = 'image-generation';
  private useInMemory: boolean;

  constructor() {
    this.useInMemory = process.env.NODE_ENV !== 'production';

    if (this.useInMemory) {
      try {
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
      this.queue = new InMemoryImageGenerationQueue();
      if (process.env.NODE_ENV === 'development') {
        console.log('[ImageGenerationQueue] Using in-memory queue (Redis not available)');
      }
    } else {
      this.queue = this.initializeQueue();
    }
  }

  private initializeQueue(): Queue {
    const options: QueueOptions = {
      connection: getBullConnection(),
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600,
          count: 200,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    return new Queue(this.queueName, options);
  }

  /**
   * Encola una solicitud de generación de imagen
   */
  async addGenerationJob(
    data: ImageGenerationJobData,
    options?: ImageGenerationJobOptions,
  ): Promise<Job> {
    const jobOptions = {
      delay: options?.delay,
      priority: options?.priority ?? 3,
    };

    try {
      const job = await this.queue.add('generate-image', data, jobOptions);
      return job as Job;
    } catch (error) {
      console.error('[ImageGenerationQueue] Failed to add job:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un job por su ID
   */
  async getJobState(jobId: string): Promise<{
    state: string | null;
    data: ImageGenerationJobData | null;
    result: ImageGenerationJobResult | null;
    failedReason: string | null;
  } | null> {
    try {
      if (this.useInMemory) {
        // In-memory queue doesn't support per-job lookup easily
        return null;
      }

      const bullQueue = this.queue as Queue;
      const job = await bullQueue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      const returnValue = job.returnvalue as ImageGenerationJobResult | null;

      return {
        state,
        data: job.data as ImageGenerationJobData,
        result: returnValue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      console.error('[ImageGenerationQueue] Failed to get job state:', error);
      return null;
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────

  async getStats(): Promise<QueueStats> {
    try {
      if (this.useInMemory) {
        const inMem = this.queue as InMemoryImageGenerationQueue;
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
      console.error('[ImageGenerationQueue] Failed to get stats:', error);
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  async close(): Promise<void> {
    try {
      if (!this.useInMemory) {
        await (this.queue as Queue).close();
      } else {
        await (this.queue as InMemoryImageGenerationQueue).close();
      }
    } catch (error) {
      console.error('[ImageGenerationQueue] Failed to close:', error);
    }
  }

  get name(): string {
    return this.queueName;
  }

  get isMock(): boolean {
    return this.useInMemory;
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let globalQueue: ImageGenerationQueue | null = null;

export function getImageGenerationQueue(): ImageGenerationQueue {
  if (!globalQueue) {
    globalQueue = new ImageGenerationQueue();
  }
  return globalQueue;
}

export function resetImageGenerationQueue(): void {
  globalQueue?.close();
  globalQueue = null;
}

export default ImageGenerationQueue;
