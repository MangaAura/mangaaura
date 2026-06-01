/**
 * Queue types (no redis/server-only imports).
 *
 * Safe to import from client components — no ioredis or server-only modules.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type JobType = 'analyze' | 'generate' | 'summarize' | 'classify' | 'embed';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface InferenceJob {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  userId?: string;
  metadata?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  };
}

export interface QueuedJob {
  id: string;
  job: InferenceJob;
  priority: number;
  timestamp: Date;
  attempts: number;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  type: JobType;
}

export interface QueueStats {
  length: number;
  processing: number;
  completed: number;
  failed: number;
  avgWaitTime: number; // milliseconds
  byPriority: Record<number, number>;
  byType: Record<JobType, number>;
}

export interface PriorityConfig {
  critical: 1;   // Priority 1: Critical - Urgent user-facing operations
  high: 2;       // Priority 2: High - Important user requests
  normal: 3;     // Priority 3: Normal - Standard operations
  low: 4;        // Priority 4: Low - Background tasks
  background: 5; // Priority 5: Background - Non-urgent processing
}

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

export interface QueueConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  enablePersistence?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redis?: any;
  rateLimits?: Partial<Record<JobType, RateLimitConfig>>;
}

// ============================================================================
// Event Types (for TypeScript support)
// ============================================================================

export interface QueueEvents {
  'job:added': { jobId: string; type: JobType; priority: number; timestamp: Date };
  'job:started': { jobId: string; type: JobType; priority: number; waitTime: number; attempts: number };
  'job:completed': { jobId: string; type: JobType; priority: number; duration: number; result?: Record<string, unknown> };
  'job:failed': { jobId: string; type: JobType; priority: number; attempts: number; error: string; deadLettered: boolean };
  'job:retry': { jobId: string; type: JobType; attempts: number; maxRetries: number };
  'job:queued': { jobId: string; type: JobType; priority: number; timestamp: Date };
  'queue:empty': { timestamp: Date };
  'alert:updated': { id: string; type: string; severity: string; title: string; message: string };
  'alert:cleared': { id: string; type: string };
  'config:updated': { thresholds: Record<string, unknown> };
  'model:health-changed': { modelId: string; modelName: string; previousHealth: string; newHealth: string };
  'pool:event': { event: string; data?: unknown };
  'model:registered': { modelId: string; name: string };
  'model:unregistered': { modelId: string };
  'strategy:changed': { strategy: string };
  'alert:model-degraded': { modelId: string; modelName: string };
  'alert:model-unhealthy': { modelId: string; modelName: string; consecutiveFailures: number };
  'alert:model-recovered': { modelId: string; modelName: string; previousHealth: string };
  'alert:high-error-rate': { errorRate: number; threshold: number };
  'alert:queue-backlog': { queueDepth: number; threshold: number };
  'service:started': undefined;
  'service:stopped': undefined;
  'health:check-completed': undefined;
}
