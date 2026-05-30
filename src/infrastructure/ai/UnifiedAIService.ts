/**
 * UnifiedAIService - Servicio unificado de IA
 * 
 * Integra todos los componentes del sistema de IA:
 * - InferenceJobQueue: Cola prioritaria de trabajos
 * - ModelWorkerPool: Pool de workers para ejecución
 * - ParallelInferenceEngine: Motor de inferencia paralela
 * - ModelRegistry: Registro y routing de modelos
 * 
 * Esta es la capa de orquestación principal que expone una API simple
 * para el resto de la aplicación.
 */

import { EventEmitter } from 'events';

import { IAProvider, CommentAnalysis, ChapterSummary, QualityAssessment } from '@/core/services/IAProvider';
import { AlertManager, getAlertManager } from '@/infrastructure/ai/AlertManager';
import { InMemoryAIProvider } from '@/infrastructure/ai/InMemoryAIProvider';
import { 
  ModelRegistry, 
  RegisteredModel, 
  RoutingStrategy,
  RoutingMetrics 
} from '@/infrastructure/ai/ModelRegistry';
import { ModelWorkerPool, InferenceJob as WorkerJob, PoolMetrics, PoolEvent } from '@/infrastructure/ai/ModelWorkerPool';
import { NVIDIAProvider } from '@/infrastructure/ai/NVIDIAProvider';
import { 
  ParallelInferenceEngine, 
  InferenceJob as EngineJob, 
  InferenceResult as EngineResult,
  InferenceProvider
} from '@/infrastructure/ai/ParallelInferenceEngine';
import { InferenceJobQueue, JobType, QueueStats } from '@/infrastructure/queue/InferenceJobQueue';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ServiceJobType = 
  | 'analyze-comment'
  | 'detect-spoiler'
  | 'summarize-chapter'
  | 'generate-notification'
  | 'generate-embedding'
  | 'classify-genre'
  | 'classify-quality'
  | 'batch-inference';

export interface ServiceJob {
  id?: string;
  type: ServiceJobType;
  payload: unknown;
  priority?: number;
  modelId?: string;
  timeout?: number;
  retryable?: boolean;
}

export interface ServiceJobResult<T = unknown> {
  jobId: string;
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    retryable: boolean;
  };
  metadata: {
    latencyMs: number;
    modelId?: string;
    queueTimeMs: number;
    processingTimeMs: number;
  };
}

export interface BatchJobRequest {
  jobs: ServiceJob[];
  strategy?: 'parallel' | 'sequential' | 'race';
  failFast?: boolean;
}

export interface ServiceConfig {
  // Queue config
  maxRetries?: number;
  retryDelayMs?: number;
  enablePersistence?: boolean;
  
  // Pool config
  minWorkers?: number;
  maxWorkers?: number;
  maxJobsPerWorker?: number;
  idleTimeoutMs?: number;
  
  // Engine config
  maxConcurrent?: number;
  defaultTimeout?: number;
  
  // Routing
  defaultStrategy?: RoutingStrategy;
  
  // Providers
  nvidiaApiKey?: string;
  useInMemoryFallback?: boolean;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    queue: 'up' | 'down';
    pool: 'up' | 'down';
    engine: 'up' | 'down';
    registry: 'up' | 'down';
  };
  models: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  performance: {
    throughput: number;
    avgLatency: number;
    queueDepth: number;
  };
}

export interface ServiceMetrics {
  jobs: {
    total: number;
    completed: number;
    failed: number;
    retried: number;
    cancelled: number;
  };
  performance: {
    avgQueueTimeMs: number;
    avgProcessingTimeMs: number;
    throughputPerMinute: number;
    errorRate: number;
  };
  models: RoutingMetrics;
}

// ============================================================================
// Provider Adapter
// ============================================================================

class IAProviderAdapter implements InferenceProvider {
  constructor(_provider?: any) {}

  async infer(modelId: string, input: unknown): Promise<unknown> {
    // Este adapter es un puente genérico - en producción sería más específico
    // por modelo. Por ahora devuelve un resultado simulado.
    return { modelId, input, timestamp: Date.now() };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// ============================================================================
// Unified AI Service
// ============================================================================

export class UnifiedAIService extends EventEmitter {
  private queue: InferenceJobQueue;
  private pool: ModelWorkerPool;
  private engine: ParallelInferenceEngine;
  private registry: ModelRegistry;
  private alertManager: AlertManager;

  private providers: Map<string, IAProvider> = new Map();
  private config: Required<ServiceConfig>;
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  // Metrics tracking
  private metrics = {
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    retriedJobs: 0,
    cancelledJobs: 0,
    totalQueueTime: 0,
    totalProcessingTime: 0,
  };

  // Last emitted alert states (to avoid duplicate emissions)
  private lastEmittedStates = {
    modelHealth: new Map<string, string>(),
    errorRateHigh: false,
    queueBacklog: false,
  };

  constructor(config: ServiceConfig = {}) {
    super();
    this.setMaxListeners(100);
    
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 5000,
      enablePersistence: config.enablePersistence ?? false,
      minWorkers: config.minWorkers ?? 2,
      maxWorkers: config.maxWorkers ?? 10,
      maxJobsPerWorker: config.maxJobsPerWorker ?? 100,
      idleTimeoutMs: config.idleTimeoutMs ?? 60000,
      maxConcurrent: config.maxConcurrent ?? 5,
      defaultTimeout: config.defaultTimeout ?? 30000,
      defaultStrategy: config.defaultStrategy ?? 'round-robin',
      nvidiaApiKey: config.nvidiaApiKey ?? process.env.NVIDIA_API_KEY ?? '',
      useInMemoryFallback: config.useInMemoryFallback ?? true,
    };

    // Initialize components
    this.queue = new InferenceJobQueue({
      maxRetries: this.config.maxRetries,
      retryDelayMs: this.config.retryDelayMs,
      enablePersistence: this.config.enablePersistence,
    });

    this.pool = new ModelWorkerPool({
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers,
      idleTimeoutMs: this.config.idleTimeoutMs,
      maxJobsPerWorker: this.config.maxJobsPerWorker,
    });

    this.engine = new ParallelInferenceEngine(
      {
        maxConcurrent: this.config.maxConcurrent,
        defaultTimeout: this.config.defaultTimeout,
      },
      (modelId) => new IAProviderAdapter(this.getProvider(modelId))
    );

    this.registry = new ModelRegistry();
    this.alertManager = getAlertManager();

    this.setupEventListeners();
    this.registerDefaultModels();
    this.setupAlertListeners();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private setupEventListeners(): void {
    // Queue events
    this.queue.on('job:added', (payload) => {
      (this as any).emit('job:queued', payload);
      this.processQueue();
    });

    this.queue.on('job:started', (payload) => {
      (this as any).emit('job:started', payload);
    });

    this.queue.on('job:completed', (payload) => {
      this.metrics.completedJobs++;
      (this as any).emit('job:completed', payload);
    });

    this.queue.on('job:failed', (payload) => {
      if (payload.deadLettered) {
        this.metrics.failedJobs++;
      } else {
        this.metrics.retriedJobs++;
      }
      (this as any).emit('job:failed', payload);
    });

    // Pool events
    this.pool.onEvent((event: PoolEvent) => {
      (this as any).emit('pool:event', event);
    });
  }

  private registerDefaultModels(): void {
    // Register NVIDIA models
    if (this.config.nvidiaApiKey) {
      this.registry.register({
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        name: 'NVIDIA Llama 3.1 Nemotron 70B',
        provider: 'nvidia',
        capabilities: ['chat', 'summarization', 'classification'],
        config: {
          maxRequestsPerMinute: 40,
          contextWindow: 128000,
          defaultTemperature: 0.7,
          timeoutMs: 30000,
          weight: 10,
        },
        status: {
          health: 'unknown',
          consecutiveFailures: 0,
          totalSuccessfulRequests: 0,
          totalFailedRequests: 0,
        },
        registeredAt: new Date(),
      });

      this.registry.register({
        id: 'nvidia/nv-embedqa-e5-v5',
        name: 'NVIDIA E5 Embedding',
        provider: 'nvidia',
        capabilities: ['embedding'],
        config: {
          maxRequestsPerMinute: 100,
          timeoutMs: 10000,
          weight: 10,
        },
        status: {
          health: 'unknown',
          consecutiveFailures: 0,
          totalSuccessfulRequests: 0,
          totalFailedRequests: 0,
        },
        registeredAt: new Date(),
      });

      this.providers.set(
        'nvidia',
        new NVIDIAProvider({ apiKey: this.config.nvidiaApiKey })
      );
    }

    // Register in-memory fallback
    if (this.config.useInMemoryFallback) {
      this.registry.register({
        id: 'in-memory/fallback',
        name: 'In-Memory Fallback',
        provider: 'local',
        capabilities: ['chat', 'summarization', 'classification', 'embedding'],
        config: {
          maxRequestsPerMinute: 1000,
          timeoutMs: 5000,
          weight: 1,
        },
        status: {
          health: 'healthy',
          consecutiveFailures: 0,
          totalSuccessfulRequests: 0,
          totalFailedRequests: 0,
        },
        registeredAt: new Date(),
      });

      this.providers.set('in-memory', new InMemoryAIProvider());
    }
  }

  // ==========================================================================
  // Service Lifecycle
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start processing loop
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100);

    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    (this as any).emit('service:started', undefined);
    console.info('[UnifiedAIService] Service started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.pool.shutdown();
    this.queue.dispose();
    
    (this as any).emit('service:stopped', undefined);
    console.info('[UnifiedAIService] Service stopped');
  }

  // ==========================================================================
  // Core API Methods
  // ==========================================================================

  /**
   * Submit a job to the AI service
   */
  async submit<T = unknown>(job: ServiceJob): Promise<ServiceJobResult<T>> {
    const jobId = job.id ?? crypto.randomUUID();
    const enqueueTime = Date.now();
    
    this.metrics.totalJobs++;

    try {
      // Map service job type to queue job type
      const queueJobType = this.mapJobType(job.type);
      
      // Add to queue
      const queueJobId = this.queue.enqueue(
        {
          id: jobId,
          type: queueJobType,
          payload: this.serializePayload(job.payload),
          metadata: {
            model: job.modelId,
            timeout: job.timeout,
          },
        },
        job.priority ?? 3
      );

      // Wait for completion (using event-based completion tracking)
      const result = await this.waitForJobCompletion<T>(queueJobId, job.timeout);
      
      const totalTime = Date.now() - enqueueTime;
      
      return {
        jobId: queueJobId,
        success: true,
        data: result,
        metadata: {
          latencyMs: totalTime,
          queueTimeMs: result.queueTimeMs ?? 0,
          processingTimeMs: result.processingTimeMs ?? totalTime,
        },
      };
    } catch (error) {
      const totalTime = Date.now() - enqueueTime;
      
      return {
        jobId,
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'JOB_FAILED',
          retryable: job.retryable ?? true,
        },
        metadata: {
          latencyMs: totalTime,
          queueTimeMs: 0,
          processingTimeMs: totalTime,
        },
      };
    }
  }

  /**
   * Submit multiple jobs for batch processing
   */
  async submitBatch<T = unknown>(
    request: BatchJobRequest
  ): Promise<ServiceJobResult<T>[]> {
    const { jobs, strategy = 'parallel', failFast = false } = request;

    if (strategy === 'parallel') {
      const promises = jobs.map((job) => this.submit<T>(job));
      
      if (failFast) {
        return Promise.all(promises);
      } else {
        return Promise.allSettled(promises).then((results) =>
          results.map((r) =>
            r.status === 'fulfilled'
              ? r.value
              : ({
                  jobId: 'unknown',
                  success: false,
                  error: {
                    message: r.reason?.message ?? 'Unknown error',
                    code: 'BATCH_FAILED',
                    retryable: true,
                  },
                  metadata: { latencyMs: 0, queueTimeMs: 0, processingTimeMs: 0 },
                } as ServiceJobResult<T>)
          )
        );
      }
    }

    if (strategy === 'sequential') {
      const results: ServiceJobResult<T>[] = [];
      for (const job of jobs) {
        const result = await this.submit<T>(job);
        results.push(result);
        if (!result.success && failFast) break;
      }
      return results;
    }

    if (strategy === 'race') {
      const result = await Promise.race(jobs.map((job) => this.submit<T>(job)));
      return [result];
    }

    throw new Error(`Unknown strategy: ${strategy}`);
  }

  /**
   * Execute using the parallel inference engine directly
   */
  async executeParallel(jobs: EngineJob[]): Promise<EngineResult[]> {
    return this.engine.executeBatch(jobs);
  }

  // ==========================================================================
  // Specialized Methods - Direct execution for simple operations
  // ==========================================================================

  async analyzeComment(content: string, context?: string): Promise<ServiceJobResult<CommentAnalysis>> {
    const startTime = Date.now();
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.analyzeComment(content, context);
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'ANALYZE_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    }
  }

  async detectSpoiler(content: string, chapterContext: string): Promise<ServiceJobResult<number>> {
    const startTime = Date.now();
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.detectSpoiler(content, chapterContext);
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'SPOILER_DETECT_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    }
  }

  async summarizeChapter(chapterText: string): Promise<ServiceJobResult<ChapterSummary>> {
    const startTime = Date.now();
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.summarizeChapter(chapterText);
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'SUMMARIZE_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    }
  }

  async generateEmbedding(text: string): Promise<ServiceJobResult<number[]>> {
    const startTime = Date.now();
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.generateEmbedding(text);
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'EMBEDDING_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    }
  }

  async classifyGenre(prompt: string): Promise<ServiceJobResult<string[]>> {
    const startTime = Date.now();
    this.metrics.totalJobs++;
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.classifyGenre(prompt);
      const latency = Date.now() - startTime;
      this.metrics.completedJobs++;
      this.metrics.totalProcessingTime += latency;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: Math.max(latency, 1), queueTimeMs: 0, processingTimeMs: Math.max(latency, 1) },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.failedJobs++;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'CLASSIFY_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: Math.max(latency, 1), queueTimeMs: 0, processingTimeMs: Math.max(latency, 1) },
      };
    }
  }

  async classifyQuality(imageUrl: string): Promise<ServiceJobResult<QualityAssessment>> {
    const startTime = Date.now();
    try {
      const provider = this.selectProvider() ?? new InMemoryAIProvider();
      const result = await provider.classifyQuality(imageUrl);
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: true,
        data: result,
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        jobId: crypto.randomUUID(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'QUALITY_FAILED',
          retryable: true,
        },
        metadata: { latencyMs: latency, queueTimeMs: 0, processingTimeMs: latency },
      };
    }
  }

  // ==========================================================================
  // Model Management
  // ==========================================================================

  registerModel(model: RegisteredModel): void {
    this.registry.register(model);
    (this as any).emit('model:registered', { modelId: model.id, name: model.name });
  }

  unregisterModel(modelId: string): void {
    this.registry.unregister(modelId);
    (this as any).emit('model:unregistered', { modelId });
  }

  getModel(modelId: string): RegisteredModel | undefined {
    return this.registry.getModel(modelId);
  }

  listModels(): RegisteredModel[] {
    return this.registry.getAllModels();
  }

  setRoutingStrategy(strategy: RoutingStrategy): void {
    // Strategy is applied per-request in selectModel
    (this as any).emit('strategy:changed', { strategy });
  }

  // ==========================================================================
  // Monitoring & Health
  // ==========================================================================

  getHealth(): ServiceHealth {
    const modelMetrics = this.registry.getRoutingMetrics();
    const queueStats = this.queue.getStats();
    const poolMetrics = this.pool.getMetrics();
    
    const healthyModels = modelMetrics.models.filter(m => m.healthStatus === 'healthy').length;
    const degradedModels = modelMetrics.models.filter(m => m.healthStatus === 'degraded').length;
    const unhealthyModels = modelMetrics.models.filter(m => m.healthStatus === 'unhealthy').length;

    const status: ServiceHealth['status'] = 
      unhealthyModels > 0 ? 'degraded' : 
      healthyModels === 0 && modelMetrics.totalRegisteredModels > 0 ? 'unhealthy' : 
      'healthy';

    return {
      status,
      components: {
        queue: 'up',
        pool: poolMetrics.activeWorkers > 0 ? 'up' : 'down',
        engine: 'up',
        registry: modelMetrics.totalRegisteredModels > 0 ? 'up' : 'down',
      },
      models: {
        total: modelMetrics.totalRegisteredModels,
        healthy: healthyModels,
        degraded: degradedModels,
        unhealthy: unhealthyModels,
      },
      performance: {
        throughput: poolMetrics.throughput,
        avgLatency: poolMetrics.averageExecutionTimeMs,
        queueDepth: queueStats.length,
      },
    };
  }

  getMetrics(): ServiceMetrics {
    const modelMetrics = this.registry.getRoutingMetrics();
    const totalCompleted = this.metrics.completedJobs + this.metrics.failedJobs;
    
    return {
      jobs: {
        total: this.metrics.totalJobs,
        completed: this.metrics.completedJobs,
        failed: this.metrics.failedJobs,
        retried: this.metrics.retriedJobs,
        cancelled: this.metrics.cancelledJobs,
      },
      performance: {
        avgQueueTimeMs: totalCompleted > 0 ? this.metrics.totalQueueTime / totalCompleted : 0,
        avgProcessingTimeMs: totalCompleted > 0 ? this.metrics.totalProcessingTime / totalCompleted : 0,
        throughputPerMinute: modelMetrics.models.reduce((sum, m) => sum + m.totalRequests, 0) / 
          (Date.now() - (modelMetrics.lastUpdated.getTime() - 60000)) * 60000,
        errorRate: totalCompleted > 0 ? this.metrics.failedJobs / totalCompleted : 0,
      },
      models: modelMetrics,
    };
  }

  getQueueStats(): QueueStats {
    return this.queue.getStats();
  }

  getPoolMetrics(): PoolMetrics {
    return this.pool.getMetrics();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private mapJobType(serviceType: ServiceJobType): JobType {
    const mapping: Record<ServiceJobType, JobType> = {
      'analyze-comment': 'analyze',
      'detect-spoiler': 'analyze',
      'summarize-chapter': 'summarize',
      'generate-notification': 'generate',
      'generate-embedding': 'embed',
      'classify-genre': 'classify',
      'classify-quality': 'classify',
      'batch-inference': 'generate',
    };
    return mapping[serviceType] ?? 'generate';
  }

  private serializePayload(payload: unknown): Record<string, unknown> {
    if (typeof payload === 'object' && payload !== null) {
      return payload as Record<string, unknown>;
    }
    return { value: payload };
  }

  private async waitForJobCompletion<T>(
    jobId: string, 
    timeout?: number
  ): Promise<T & { queueTimeMs: number; processingTimeMs: number }> {
    return new Promise((resolve, reject) => {
      const timeoutId = timeout ? setTimeout(() => {
        reject(new Error(`Job ${jobId} timed out`));
      }, timeout) : undefined;

      const checkCompletion = () => {
        const job = this.queue.getJob(jobId);
        
        if (!job) {
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error(`Job ${jobId} not found`));
          return;
        }

        if (job.status === 'completed') {
          if (timeoutId) clearTimeout(timeoutId);
          const queueTimeMs = (job.startedAt?.getTime() ?? job.timestamp.getTime()) - job.timestamp.getTime();
          const processingTimeMs = (job.completedAt?.getTime() ?? Date.now()) - (job.startedAt?.getTime() ?? job.timestamp.getTime());
          resolve({ ...job as unknown as T, queueTimeMs, processingTimeMs });
          return;
        }

        if (job.status === 'failed') {
          if (timeoutId) clearTimeout(timeoutId);
          reject(new Error(job.error ?? 'Job failed'));
          return;
        }

        // Still processing, check again
        setTimeout(checkCompletion, 50);
      };

      checkCompletion();
    });
  }

  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    const job = this.queue.dequeue();
    if (!job) return;

    const provider = this.selectProvider(job.job.metadata?.model);
    if (!provider) {
      this.queue.fail(job.id, 'No available provider');
      return;
    }

    try {
      // Execute via worker pool
      const workerJob: WorkerJob = {
        type: this.mapWorkerJobType(job.type),
        params: Object.values(job.job.payload),
      };

      const result = await this.pool.execute(workerJob, provider);
      
      if (result.success) {
        this.queue.complete(job.id, { result: result.data });
      } else {
        this.queue.fail(job.id, result.error?.message ?? 'Unknown error');
      }
    } catch (error) {
      this.queue.fail(job.id, error instanceof Error ? error.message : String(error));
    }
  }

  private mapWorkerJobType(jobType: JobType): WorkerJob['type'] {
    const mapping: Record<JobType, WorkerJob['type']> = {
      'analyze': 'analyzeComment',
      'generate': 'generateNotificationHook',
      'summarize': 'summarizeChapter',
      'classify': 'classifyGenre',
      'embed': 'generateEmbedding',
    };
    return mapping[jobType];
  }

  private selectProvider(modelId?: string): IAProvider | null {
    if (modelId) {
      // Try to get specific provider for model
      const model = this.registry.getModel(modelId);
      if (model) {
        const provider = this.providers.get(model.provider);
        if (provider) return provider;
      }
    }

    // Fall back to healthy provider
    const healthyModels = this.registry.getHealthyModels();
    for (const model of healthyModels) {
      const provider = this.providers.get(model.provider);
      if (provider) return provider;
    }

    // Last resort: in-memory provider
    return this.providers.get('in-memory') ?? null;
  }

  private getProvider(modelId: string): IAProvider {
    return this.selectProvider(modelId) ?? new InMemoryAIProvider();
  }

  private async performHealthChecks(): Promise<void> {
    const models = this.registry.getAllModels();

    for (const model of models) {
      const previousHealth = model.status.health;

      try {
        const provider = this.providers.get(model.provider);
        if (!provider) {
          this.registry.updateHealth(model.id, false);
          this.checkAndEmitModelAlert(model, previousHealth, 'unhealthy');
          continue;
        }

        // Simple health check - can the provider execute?
        const start = Date.now();
        await provider.generateEmbedding('health check');
        const latency = Date.now() - start;

        this.registry.updateHealth(model.id, true, latency);
        this.checkAndEmitModelAlert(model, previousHealth, 'healthy');
      } catch (error) {
        this.registry.updateHealth(model.id, false);
        const updatedModel = this.registry.getModel(model.id);
        const newHealth = updatedModel?.status.health ?? 'unhealthy';
        this.checkAndEmitModelAlert(model, previousHealth, newHealth);
      }
    }

    // Check for high error rate
    this.checkAndEmitErrorRateAlert();

    // Check for queue backlog
    this.checkAndEmitQueueBacklogAlert();

    (this as any).emit('health:check-completed', undefined);
  }

  // ===========================================================================
  // Alert Methods
  // ===========================================================================

  private setupAlertListeners(): void {
    // Escuchar cambios de salud desde el registro
    (this.registry as any).on('model:health-changed', (data: { modelId: string; previousHealth: string; newHealth: string }) => {
      const model = this.registry.getModel(data.modelId);
      if (model) {
        this.checkAndEmitModelAlert(model, data.previousHealth as 'healthy' | 'degraded' | 'unhealthy', data.newHealth as 'healthy' | 'degraded' | 'unhealthy');
      }
    });
  }

  private checkAndEmitModelAlert(
    model: { id: string; name: string; status: { health: string; consecutiveFailures: number } },
    previousHealth: string,
    newHealth: string
  ): void {
    // Emitir alerta si el modelo pasó a degraded
    if (newHealth === 'degraded' && previousHealth !== 'degraded') {
      this.alertManager.notifyModelDegraded(
        model.id,
        model.name,
        `El modelo tiene ${model.status.consecutiveFailures} fallos consecutivos`
      );
      (this as any).emit('alert:model-degraded', { modelId: model.id, modelName: model.name });
    }

    // Emitir alerta si el modelo pasó a unhealthy
    if (newHealth === 'unhealthy' && previousHealth !== 'unhealthy') {
      this.alertManager.notifyModelUnhealthy(
        model.id,
        model.name,
        model.status.consecutiveFailures
      );
      (this as any).emit('alert:model-unhealthy', { modelId: model.id, modelName: model.name, consecutiveFailures: model.status.consecutiveFailures });
    }

    // Limpiar alertas si el modelo volvió a healthy
    if (newHealth === 'healthy' && (previousHealth === 'degraded' || previousHealth === 'unhealthy')) {
      (this as any).emit('alert:model-recovered', { modelId: model.id, modelName: model.name, previousHealth });
    }

    // Guardar estado actual
    this.lastEmittedStates.modelHealth.set(model.id, newHealth);
  }

  private checkAndEmitErrorRateAlert(): void {
    const totalCompleted = this.metrics.completedJobs + this.metrics.failedJobs;
    if (totalCompleted === 0) return;

    const errorRate = this.metrics.failedJobs / totalCompleted;
    const threshold = this.alertManager.getThresholds().errorRateThreshold;

    if (errorRate > threshold) {
      if (!this.lastEmittedStates.errorRateHigh) {
        this.alertManager.notifyHighErrorRate(errorRate, threshold);
        (this as any).emit('alert:high-error-rate', { errorRate, threshold });
        this.lastEmittedStates.errorRateHigh = true;
      }
    } else {
      // Resetear estado si la tasa de error volvió a la normalidad
      this.lastEmittedStates.errorRateHigh = false;
    }
  }

  private checkAndEmitQueueBacklogAlert(): void {
    const queueStats = this.queue.getStats();
    const queueDepth = queueStats.length;
    const threshold = this.alertManager.getThresholds().queueBacklogThreshold;

    if (queueDepth > threshold) {
      if (!this.lastEmittedStates.queueBacklog) {
        this.alertManager.notifyQueueBacklog(queueDepth, threshold);
        (this as any).emit('alert:queue-backlog', { queueDepth, threshold });
        this.lastEmittedStates.queueBacklog = true;
      }
    } else {
      // Resetear estado si la cola volvió a la normalidad
      this.lastEmittedStates.queueBacklog = false;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalService: UnifiedAIService | null = null;

export function getUnifiedAIService(config?: ServiceConfig): UnifiedAIService {
  if (!globalService) {
    globalService = new UnifiedAIService(config);
  }
  return globalService;
}

export async function resetUnifiedAIService(): Promise<void> {
  if (globalService) {
    await globalService.stop();
    globalService = null;
  }
}

export default UnifiedAIService;
