import { EventEmitter } from 'events';

import type {
  InferenceJob,
  JobType,
  QueuedJob,
  QueueConfig,
  QueueStats,
  RateLimitConfig,
  PriorityConfig,
  JobStatus,
 QueueEvents } from './types';

// Re-export types for backward compatibility (other modules import from InferenceJobQueue)
export type { JobType, QueueStats } from './types';

// Dynamic/lazy import of redis — avoids bundling ioredis into client components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisPromise: Promise<any> | null = null;
async function ensureAppRedis(): Promise<any> {
  if (!_redisPromise) {
    _redisPromise = import('@/lib/redis').then(mod => mod.redis);
  }
  return _redisPromise;
}

// ============================================================================
// Min Heap Implementation for Priority Queue
// ============================================================================

class MinHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compare = compareFn;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return root;
  }

  remove(predicate: (item: T) => boolean): T | null {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return null;

    const removed = this.heap[index];

    if (index === this.heap.length - 1) {
      this.heap.pop();
    } else {
      this.heap[index] = this.heap.pop()!;
      // Rebalance
      if (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
          this.bubbleUp(index);
        } else {
          this.bubbleDown(index);
        }
      } else {
        this.bubbleDown(index);
      }
    }

    return removed;
  }

  find(predicate: (item: T) => boolean): T | null {
    return this.heap.find(predicate) ?? null;
  }

  toArray(): T[] {
    return [...this.heap];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

// ============================================================================
// Inference Job Queue
// ============================================================================

export class InferenceJobQueue extends EventEmitter {
  // Priority constants
  static readonly PRIORITIES: PriorityConfig = {
    critical: 1,
    high: 2,
    normal: 3,
    low: 4,
    background: 5,
  };

  private queue: MinHeap<QueuedJob>;
  private processing: Map<string, QueuedJob>;
  private completed: Map<string, QueuedJob>;
  private failed: Map<string, QueuedJob>;
  private deadLetterQueue: QueuedJob[];
  private jobIndex: Map<string, QueuedJob>;

  // Rate limiting
  private rateLimiters: Map<JobType, number[]>;
  private rateLimitConfig: Partial<Record<JobType, RateLimitConfig>>;

  // Configuration
  private maxRetries: number;
  private enablePersistence: boolean;
  // Usamos el redis compartido de @/lib/redis que tiene Proxy de cuota.
  // Se inicializa lazy para evitar que ioredis se bundlee en client components.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redis?: any;
  private _redisInitPromise: Promise<void> | null = null;

  // Statistics tracking
  private totalWaitTime: number = 0;
  private processedCount: number = 0;

  constructor(config: QueueConfig = {}) {
    super();
    this.setMaxListeners(100);

    // Initialize priority queue: lower priority number = higher priority
    // For same priority, use FIFO (timestamp comparison)
    this.queue = new MinHeap<QueuedJob>((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    this.processing = new Map();
    this.completed = new Map();
    this.failed = new Map();
    this.deadLetterQueue = [];
    this.jobIndex = new Map();

    this.rateLimiters = new Map();
    this.rateLimitConfig = config.rateLimits || {};

    this.maxRetries = config.maxRetries ?? 3;
    this.enablePersistence = config.enablePersistence ?? false;
    // Usar el redis compartido de la app en lugar de una instancia ioredis separada.
    // Import lazy para evitar bundlear ioredis en client components.
    this.redis = config.redis || null;
    this._lazyInitRedis();

    // Initialize rate limiters for all job types
    const jobTypes: JobType[] = ['analyze', 'generate', 'summarize', 'classify', 'embed'];
    jobTypes.forEach(type => {
      this.rateLimiters.set(type, []);
    });
  }

  // ============================================================================
  // Core Queue Operations
  // ============================================================================

  /**
   * Add a job to the queue with specified priority
   * @param job The inference job to queue
   * @param priority Lower number = higher priority (1=critical, 5=background)
   * @returns The job ID
   */
  enqueue(job: InferenceJob, priority: number = InferenceJobQueue.PRIORITIES.background): string {
    // Check rate limit
    if (!this.checkRateLimit(job.type)) {
      throw new Error(`Rate limit exceeded for job type: ${job.type}`);
    }

    const jobId = job.id || crypto.randomUUID();
    const now = new Date();

    const queuedJob: QueuedJob = {
      id: jobId,
      job: { ...job, id: jobId },
      priority,
      timestamp: now,
      attempts: 0,
      status: 'pending',
      type: job.type,
    };

    // Add to queue and index
    this.queue.push(queuedJob);
    this.jobIndex.set(jobId, queuedJob);

    // Persist if enabled
    if (this.enablePersistence && this.redis) {
      this.persistJob(queuedJob);
    }

    // Emit event
    this.emit('job:added', {
      jobId,
      type: job.type,
      priority,
      timestamp: now,
    });

    return jobId;
  }

  /**
   * Get and remove the next highest priority job
   * @returns The next job or null if queue is empty
   */
  dequeue(): QueuedJob | null {
    // Check if queue is empty
    if (this.queue.isEmpty()) {
      this.emit('queue:empty', { timestamp: new Date() });
      return null;
    }

    const job = this.queue.pop();
    if (!job) return null;

    // Update status
    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;

    // Move to processing map
    this.processing.set(job.id, job);

    // Update index
    this.jobIndex.set(job.id, job);

    // Calculate wait time
    const waitTime = job.startedAt.getTime() - job.timestamp.getTime();
    this.totalWaitTime += waitTime;
    this.processedCount++;

    // Emit event
    this.emit('job:started', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
      waitTime,
      attempts: job.attempts,
    });

    // Update persistence
    if (this.enablePersistence && this.redis) {
      this.persistJob(job);
    }

    return job;
  }

  /**
   * Peek at the next job without removing it
   * @returns The next job or null if queue is empty
   */
  peek(): QueuedJob | null {
    return this.queue.peek();
  }

  /**
   * Cancel a pending job by ID
   * @param jobId The ID of the job to cancel
   * @returns true if job was cancelled, false otherwise
   */
  remove(jobId: string): boolean {
    const job = this.jobIndex.get(jobId);

    if (!job) return false;

    // Can only cancel pending jobs
    if (job.status !== 'pending') return false;

    // Remove from queue
    const removed = this.queue.remove(j => j.id === jobId);
    if (!removed) return false;

    // Update status
    removed.status = 'cancelled';

    // Update index
    this.jobIndex.set(jobId, removed);

    // Persist update
    if (this.enablePersistence && this.redis) {
      this.persistJob(removed);
    }

    return true;
  }

  /**
   * Update the priority of a pending job
   * @param jobId The ID of the job
   * @param newPriority The new priority value
   * @returns true if priority was updated, false otherwise
   */
  updatePriority(jobId: string, newPriority: number): boolean {
    const job = this.jobIndex.get(jobId);

    if (!job || job.status !== 'pending') {
      return false;
    }

    // Remove and re-insert with new priority
    const removed = this.queue.remove(j => j.id === jobId);
    if (!removed) return false;

    removed.priority = newPriority;
    this.queue.push(removed);

    // Update index
    this.jobIndex.set(jobId, job);

    // Persist update
    if (this.enablePersistence && this.redis) {
      this.persistJob(job);
    }

    return true;
  }

  // ============================================================================
  // Job Status Operations
  // ============================================================================

  /**
   * Mark a job as completed
   * @param jobId The ID of the completed job
   * @param result Optional result data
   */
  complete(jobId: string, result?: Record<string, unknown>): void {
    const job = this.processing.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.completedAt = new Date();

    this.processing.delete(jobId);
    this.completed.set(jobId, job);
    this.jobIndex.set(jobId, job);

    // Emit event
    this.emit('job:completed', {
      jobId,
      type: job.type,
      priority: job.priority,
      duration: job.completedAt.getTime() - (job.startedAt?.getTime() ?? 0),
      result,
    });

    // Persist update
    if (this.enablePersistence && this.redis) {
      this.persistJob(job);
    }
  }

  /**
   * Mark a job as failed
   * @param jobId The ID of the failed job
   * @param error The error message
   * @returns true if job should be retried, false if moved to dead letter queue
   */
  fail(jobId: string, error: string): boolean {
    const job = this.processing.get(jobId);
    if (!job) return false;

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();

    this.processing.delete(jobId);

    // Check if should retry
    if (job.attempts < this.maxRetries) {
      // Requeue with same priority
      job.status = 'pending';
      delete job.startedAt;
      delete job.completedAt;
      delete job.error;

      this.queue.push(job);
      this.jobIndex.set(jobId, job);

      // Emit retry event
      this.emit('job:retry', {
        jobId,
        type: job.type,
        attempts: job.attempts,
        maxRetries: this.maxRetries,
      });

      return true;
    }

    // Move to dead letter queue
    this.failed.set(jobId, job);
    this.deadLetterQueue.push(job);
    this.jobIndex.set(jobId, job);

    // Emit event
    this.emit('job:failed', {
      jobId,
      type: job.type,
      priority: job.priority,
      attempts: job.attempts,
      error,
      deadLettered: true,
    });

    // Persist update
    if (this.enablePersistence && this.redis) {
      this.persistJob(job);
    }

    return false;
  }

  // ============================================================================
  // Statistics & Monitoring
  // ============================================================================

  /**
   * Get real-time queue statistics
   * @returns QueueStats object with current metrics
   */
  getStats(): QueueStats {
    const now = Date.now();
    const queueArray = this.queue.toArray();

    // Count by priority
    const byPriority: Record<number, number> = {};
    queueArray.forEach(job => {
      byPriority[job.priority] = (byPriority[job.priority] || 0) + 1;
    });

    // Count by type
    const byType: Record<JobType, number> = {
      analyze: 0,
      generate: 0,
      summarize: 0,
      classify: 0,
      embed: 0,
    };
    queueArray.forEach(job => {
      byType[job.type]++;
    });

    // Calculate average wait time for pending jobs
    let pendingWaitTime = 0;
    queueArray.forEach(job => {
      pendingWaitTime += now - job.timestamp.getTime();
    });

    // Total average wait time (completed + current pending)
    const totalProcessed = this.processedCount;
    const avgWaitTime = totalProcessed > 0
      ? (this.totalWaitTime + pendingWaitTime) / (totalProcessed + queueArray.length)
      : 0;

    return {
      length: queueArray.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      avgWaitTime: Math.round(avgWaitTime),
      byPriority,
      byType,
    };
  }

  /**
   * Get a job by ID
   * @param jobId The job ID
   * @returns The job or null if not found
   */
  getJob(jobId: string): QueuedJob | null {
    return this.jobIndex.get(jobId) || null;
  }

  /**
   * Get jobs by status
   * @param status The job status
   * @returns Array of jobs with the specified status
   */
  getJobsByStatus(status: JobStatus): QueuedJob[] {
    switch (status) {
      case 'pending':
        return this.queue.toArray();
      case 'processing':
        return Array.from(this.processing.values());
      case 'completed':
        return Array.from(this.completed.values());
      case 'failed':
        return Array.from(this.failed.values());
      case 'cancelled':
        return this.queue.toArray().filter(j => j.status === 'cancelled');
      default:
        return [];
    }
  }

  /**
   * Get dead letter queue contents
   * @returns Array of failed jobs
   */
  getDeadLetterQueue(): QueuedJob[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear the dead letter queue
   * @returns Number of jobs cleared
   */
  clearDeadLetterQueue(): number {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return count;
  }

  /**
   * Unregister all event listeners
   */
  removeAllListeners(): this {
    return super.removeAllListeners();
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private checkRateLimit(type: JobType): boolean {
    const config = this.rateLimitConfig[type];
    if (!config) return true;

    const now = Date.now();
    const timestamps = this.rateLimiters.get(type) || [];

    // Remove old timestamps outside the window
    const windowStart = now - config.windowMs;
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    // Check if under limit
    if (validTimestamps.length >= config.maxRequests) {
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.rateLimiters.set(type, validTimestamps);

    return true;
  }

  /**
   * Set rate limit configuration for a job type
   * @param type The job type
   * @param config The rate limit configuration
   */
  setRateLimit(type: JobType, config: RateLimitConfig): void {
    this.rateLimitConfig[type] = config;
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  private _lazyInitRedis(): void {
    if (!this._redisInitPromise && !this.redis) {
      this._redisInitPromise = ensureAppRedis().then(redis => {
        this.redis = redis;
      }).catch(err => {
        console.warn('[InferenceJobQueue] Failed to lazy-load redis:', err);
      });
    }
  }

  private async ensureRedisReady(): Promise<void> {
    if (this.redis) return;
    if (this._redisInitPromise) {
      await this._redisInitPromise;
    }
  }

  private async persistJob(job: QueuedJob): Promise<void> {
    await this.ensureRedisReady();
    if (!this.redis) return;

    try {
      const key = `inference:job:${job.id}`;
      await this.redis.setex(key, 86400, JSON.stringify(job)); // 24h TTL
    } catch (error) {
      console.error('[InferenceJobQueue] Failed to persist job:', error);
    }
  }

  /**
   * Restore jobs from Redis (call on startup if using persistence)
   */
  async restoreFromPersistence(): Promise<void> {
    await this.ensureRedisReady();
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys('inference:job:*');

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const job: QueuedJob = JSON.parse(data);
          // Only restore pending jobs
          if (job.status === 'pending') {
            job.timestamp = new Date(job.timestamp);
            this.queue.push(job);
            this.jobIndex.set(job.id, job);
          }
        }
      }

      console.info(`[InferenceJobQueue] Restored ${this.queue.size} jobs from persistence`);
    } catch (error) {
      console.error('[InferenceJobQueue] Failed to restore jobs:', error);
    }
  }

  /**
   * Clear all persisted jobs from Redis
   */
  async clearPersistence(): Promise<void> {
    await this.ensureRedisReady();
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys('inference:job:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('[InferenceJobQueue] Failed to clear persistence:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clear all jobs and reset statistics
   */
  clear(): void {
    this.queue = new MinHeap<QueuedJob>((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    this.processing.clear();
    this.completed.clear();
    this.failed.clear();
    this.deadLetterQueue = [];
    this.jobIndex.clear();

    this.totalWaitTime = 0;
    this.processedCount = 0;
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * Check if queue is empty
   */
  get isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.clear();
    this.removeAllListeners();
  }
}



// Type augmentation for EventEmitter
declare module 'events' {
  interface EventEmitter {
    emit<K extends keyof QueueEvents>(event: K, payload: QueueEvents[K]): boolean;
    emit(event: string, ...args: unknown[]): boolean;
    on<K extends keyof QueueEvents>(event: K, listener: (payload: QueueEvents[K]) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    once<K extends keyof QueueEvents>(event: K, listener: (payload: QueueEvents[K]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    off<K extends keyof QueueEvents>(event: K, listener: (payload: QueueEvents[K]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let globalQueue: InferenceJobQueue | null = null;

export function getInferenceJobQueue(config?: QueueConfig): InferenceJobQueue {
  if (!globalQueue) {
    globalQueue = new InferenceJobQueue(config);
  }
  return globalQueue;
}

export function resetInferenceJobQueue(): void {
  globalQueue?.dispose();
  globalQueue = null;
}

export default InferenceJobQueue;
