/**
 * Shared In-Memory Queue for Development
 *
 * Base class for BullMQ queue mocks when Redis is not available.
 * Elimina ~250 líneas de código duplicado entre EmailQueue,
 * NotificationQueue e InboundEmailQueue.
 *
 * @packageDocumentation
 */

import { Job } from 'bullmq';

import { isMockRedis } from '@/lib/redis';

// ============================================================================
// InMemoryQueue — Base Class
// ============================================================================

export class InMemoryQueue<T> {
  protected jobs: Map<string, { data: T; addedAt: Date }> = new Map();
  protected jobCounter = 0;
  private idPrefix: string;
  private _isEnabled: boolean;

  constructor(idPrefix: string) {
    this.idPrefix = idPrefix;
    this._isEnabled = process.env.NODE_ENV !== 'production' && isMockRedis();
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  async add(name: string, data: T, _opts?: unknown): Promise<Job> {
    if (!this._isEnabled) throw new Error('In-memory queue not enabled');

    this.jobCounter++;
    const id = `${this.idPrefix}-${this.jobCounter}`;
    this.jobs.set(id, { data, addedAt: new Date() });

    return this.createMockJob(id, name, data);
  }

  /**
   * Crea un mock Job object compatible con la interfaz Job de BullMQ
   */
  protected createMockJob(id: string, name: string, data: T): Job {
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
      getState: async () => 'completed' as const,
      retry: async () => {},
      discard: async () => { this.jobs.delete(id); },
      moveToCompleted: async () => {},
      moveToFailed: async () => {},
      changeDelay: async () => {},
      changePriority: async () => {},
      toJSON: () => ({ id, name, data, opts: {} }),
      remove: async () => { this.jobs.delete(id); },
      log: async () => {},
    } as unknown as Job;
  }

  // ─── Stats ──────────────────────────────────────────────────────

  async getWaitingCount(): Promise<number> {
    return this.jobs.size;
  }

  async getActiveCount(): Promise<number> {
    return 0;
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

  async getJobCounts(): Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }> {
    return {
      waiting: this.jobs.size,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  // ─── Job lists ──────────────────────────────────────────────────

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

  async getJobs(_types?: string[], _start?: number, _end?: number): Promise<Job[]> {
    return [];
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  async clean(_ms: number, _limit?: number | string, _type?: string): Promise<void> {
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

  protected async retry(_id: string): Promise<void> {
    // No-op
  }
}

export default InMemoryQueue;
