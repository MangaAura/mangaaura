/**
 * Inbound Email Worker for MangaAura
 * Procesa jobs de la cola de emails entrantes usando BullMQ.
 *
 * - classify: Clasifica el intent del email y lo persiste en BD
 * - process: Persiste un email ya clasificado en BD
 *
 * @packageDocumentation
 */

import { Worker, Job } from 'bullmq';

import { getBullConnection } from '@/infrastructure/queue/connection';
import type { InboundEmailJobData } from '@/infrastructure/queue/InboundEmailQueue';
import { ResendInboundRepository } from '@/infrastructure/adapters/ResendInboundRepository';
import { captureException } from '@/lib/sentry';
import { isMockRedis } from '@/lib/redis';

// ============================================================================
// Mock Worker for Development (when Redis is not available)
// ============================================================================

class MockInboundEmailWorker {
  async close(): Promise<void> {
    if (process.env.DEBUG_EMAIL) {
      console.log('[InboundEmailWorker] Mock worker stopped');
    }
  }

  on(_event: string, _listener: (...args: unknown[]) => void): void {
    // No-op
  }
}

// ============================================================================
// Inbound Email Worker
// ============================================================================

export class InboundEmailWorker {
  private worker: Worker | MockInboundEmailWorker | null = null;
  private readonly inboundRepo = new ResendInboundRepository();
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
    this.worker = new MockInboundEmailWorker();
    if (process.env.DEBUG_EMAIL) {
      console.log('[InboundEmailWorker] Running in mock mode (Redis not available)');
    }
  }

  /**
   * Inicializa el worker de emails entrantes real con BullMQ
   */
  private initializeRealWorker(): void {
    if (isMockRedis()) {
      this.useMock = true;
      this.initializeMockWorker();
      return;
    }
    try {
      this.worker = new Worker(
        'inbound-emails',
        async (job: Job<InboundEmailJobData>) => {
          await this.processJob(job);
        },
        {
          connection: getBullConnection(),
          concurrency: 5,
          limiter: {
            max: 10,
            duration: 1000, // 10 jobs per second max
          },
          stalledInterval: 30000,
          maxStalledCount: 3,
        },
      );

      this.setupEventHandlers();
    } catch (error) {
      console.error('[InboundEmailWorker] Failed to initialize:', error);
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
      const data = job.data as InboundEmailJobData;
      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_EMAIL) {
        console.info(`[InboundEmailWorker] Job ${job.id} completed: ${data.type} from ${data.email.fromEmail}`);
      }
    });

    bullWorker.on('failed', (job: Job | undefined, err: Error) => {
      if (job) {
        const data = job.data as InboundEmailJobData;
        console.error(`[InboundEmailWorker] Job ${job.id} failed (${data.type}):`, err.message);
        captureException(err, {
          extra: {
            jobId: job.id,
            jobType: data.type,
            fromEmail: data.email.fromEmail,
            queue: 'inbound-emails',
          },
        });
      } else {
        captureException(err, {
          extra: { queue: 'inbound-emails', jobId: 'unknown' },
        });
      }
    });

    bullWorker.on('error', (error: Error) => {
      console.error('[InboundEmailWorker] Worker error:', error.message);
      captureException(error, {
        extra: { queue: 'inbound-emails' },
      });
    });

    bullWorker.on('stalled', (jobId: string) => {
      console.warn(`[InboundEmailWorker] Job ${jobId} stalled — possible worker crash`);
      captureException(new Error('InboundEmailWorker job stalled'), {
        extra: { jobId, queue: 'inbound-emails' },
      });
    });
  }

  /**
   * Procesa un job según su tipo
   */
  private async processJob(job: Job<InboundEmailJobData>): Promise<void> {
    const { data } = job;

    // In mock mode, just log instead of processing
    if (this.useMock) {
      if (process.env.DEBUG_EMAIL) {
        console.log('[InboundEmailWorker] MOCK job:', { type: data.type, from: data.email.fromEmail });
      }
      return;
    }

    switch (data.type) {
      case 'classify':
        await this.processClassify(data);
        break;
      case 'process':
        await this.processProcess(data);
        break;
      default:
        throw new Error(`Unknown inbound email job type: ${(data as InboundEmailJobData).type}`);
    }
  }

  /**
   * Clasifica el email y lo persiste en BD
   */
  private async processClassify(data: InboundEmailJobData): Promise<void> {
    const classification = await this.inboundRepo.classifyEmail(data.email);
    await this.inboundRepo.processEmail(data.email, classification);
  }

  /**
   * Persiste un email ya clasificado en BD
   */
  private async processProcess(data: InboundEmailJobData): Promise<void> {
    const classification = data.classification!;
    await this.inboundRepo.processEmail(data.email, classification);
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

let globalWorker: InboundEmailWorker | null = null;

export function getInboundEmailWorker(): InboundEmailWorker {
  if (!globalWorker) {
    globalWorker = new InboundEmailWorker();
  }
  return globalWorker;
}

export function stopInboundEmailWorker(): void {
  globalWorker?.close();
  globalWorker = null;
}

export default InboundEmailWorker;
