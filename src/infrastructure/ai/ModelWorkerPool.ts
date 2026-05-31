import { IAProvider, AIServiceError } from '@/core/services/IAProvider';

/**
 * Tipo de trabajo de inferencia que puede ejecutar un worker
 */
export type InferenceJob = {
  type: 'analyzeComment' | 'detectSpoiler' | 'summarizeChapter' | 'generateNotificationHook' | 'generateEmbedding' | 'classifyGenre' | 'classifyQuality';
  params: unknown[];
};

/**
 * Resultado de un trabajo de inferencia
 */
export type InferenceResult = {
  success: boolean;
  data?: unknown;
  error?: Error;
  executionTimeMs: number;
};

/**
 * Estado de un worker en el pool
 */
export type WorkerStatus = 'idle' | 'busy' | 'error';

/**
 * Representa un worker en el pool
 */
export interface Worker {
  /** Identificador único del worker */
  id: string;
  /** Estado actual del worker */
  status: WorkerStatus;
  /** Job actual que está procesando (undefined si está idle) */
  currentJob?: InferenceJob;
  /** Timestamp del último uso */
  lastUsed: number;
  /** Contador de jobs procesados por este worker */
  jobsProcessed: number;
  /** Timestamp de creación del worker */
  createdAt: number;
  /** Timestamp del último health check exitoso */
  lastHealthCheck: number;
  /** Error actual si el worker está en estado 'error' */
  currentError?: string;
}

/**
 * Configuración del pool de workers
 */
export interface PoolConfig {
  /** Número mínimo de workers a mantener activos */
  minWorkers: number;
  /** Número máximo de workers permitidos */
  maxWorkers: number;
  /** Tiempo en ms antes de liberar un worker idle */
  idleTimeoutMs: number;
  /** Máximo de jobs por worker antes de reciclarlo */
  maxJobsPerWorker: number;
  /** Intervalo de health check en ms (default: 30000) */
  healthCheckIntervalMs?: number;
  /** Timeout de ejecución de job en ms (default: 60000) */
  jobTimeoutMs?: number;
}

/**
 * Métricas del pool de workers
 */
export interface PoolMetrics {
  /** Número de workers activos */
  activeWorkers: number;
  /** Número de workers disponibles (idle) */
  idleWorkers: number;
  /** Número de workers ocupados */
  busyWorkers: number;
  /** Número de workers en error */
  errorWorkers: number;
  /** Tamaño de la cola de jobs pendientes */
  queueSize: number;
  /** Throughput: jobs procesados por minuto */
  throughput: number;
  /** Total de jobs procesados */
  totalJobsProcessed: number;
  /** Total de jobs fallidos */
  totalJobsFailed: number;
  /** Tiempo promedio de ejecución en ms */
  averageExecutionTimeMs: number;
  /** Uptime del pool en ms */
  uptimeMs: number;
}

/**
 * Eventos del pool de workers
 */
export type PoolEvent = 
  | { type: 'worker:created'; workerId: string; timestamp: number }
  | { type: 'worker:acquired'; workerId: string; timestamp: number }
  | { type: 'worker:released'; workerId: string; timestamp: number; jobsProcessed: number }
  | { type: 'worker:recycled'; workerId: string; timestamp: number; reason: 'maxJobs' | 'error' | 'idle' }
  | { type: 'worker:error'; workerId: string; timestamp: number; error: string }
  | { type: 'worker:healthCheck:passed'; workerId: string; timestamp: number }
  | { type: 'worker:healthCheck:failed'; workerId: string; timestamp: number; error: string }
  | { type: 'pool:scaledUp'; count: number; timestamp: number }
  | { type: 'pool:scaledDown'; count: number; timestamp: number }
  | { type: 'job:completed'; workerId: string; timestamp: number; duration: number }
  | { type: 'job:failed'; workerId: string; timestamp: number; error: string };

/**
 * Pool de workers para procesar jobs de IA
 * Maneja la creación, reutilización y reciclaje de workers
 * para evitar memory leaks y optimizar el uso de recursos.
 */
export class ModelWorkerPool {
  private workers: Map<string, Worker> = new Map();
  private jobQueue: Array<{ job: InferenceJob; provider: IAProvider; resolve: (result: InferenceResult) => void; reject: (error: Error) => void; timestamp: number }> = [];
  private config: Required<PoolConfig>;
  private waitingResolvers: Array<(worker: Worker) => void> = [];
  private stats = {
    jobsProcessed: 0,
    jobsFailed: 0,
    totalExecutionTime: 0,
    startTime: Date.now(),
  };
  private timers: NodeJS.Timeout[] = [];
  private eventListeners: Array<(event: PoolEvent) => void> = [];

  /**
   * Configuración por defecto
   */
  private static readonly DEFAULT_CONFIG: Omit<Required<PoolConfig>, 'minWorkers' | 'maxWorkers' | 'idleTimeoutMs' | 'maxJobsPerWorker'> = {
    healthCheckIntervalMs: 300000, // 5 min (antes 30s)
    jobTimeoutMs: 60000,
  };

  constructor(config: PoolConfig) {
    this.config = {
      ...ModelWorkerPool.DEFAULT_CONFIG,
      ...config,
    };

    // Validar configuración
    if (this.config.minWorkers > this.config.maxWorkers) {
      throw new Error('minWorkers no puede ser mayor que maxWorkers');
    }
    if (this.config.minWorkers < 0 || this.config.maxWorkers < 1) {
      throw new Error('minWorkers debe ser >= 0 y maxWorkers >= 1');
    }
    if (this.config.idleTimeoutMs < 1000) {
      throw new Error('idleTimeoutMs debe ser al menos 1000ms');
    }
    if (this.config.maxJobsPerWorker < 1) {
      throw new Error('maxJobsPerWorker debe ser al menos 1');
    }

    // Inicializar workers mínimos
    this.initializeMinWorkers();

    // Iniciar health checks periódicos
    this.startHealthChecks();

    // Iniciar auto-cleanup de workers idle
    this.startIdleCleanup();
  }

  /**
   * Inicializa el número mínimo de workers
   */
  private initializeMinWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Crea un nuevo worker
   */
  private createWorker(): Worker {
    const worker: Worker = {
      id: `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'idle',
      lastUsed: Date.now(),
      jobsProcessed: 0,
      createdAt: Date.now(),
      lastHealthCheck: Date.now(),
    };

    this.workers.set(worker.id, worker);
    this.emitEvent({ type: 'worker:created', workerId: worker.id, timestamp: Date.now() });
    return worker;
  }

  /**
   * Emite un evento del pool
   */
  private emitEvent(event: PoolEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error en event listener:', error);
      }
    });
  }

  /**
   * Suscribe a eventos del pool
   */
  onEvent(listener: (event: PoolEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtiene un worker disponible
   * Crea uno nuevo si es necesario hasta alcanzar maxWorkers
   * Si no hay workers disponibles y se alcanzó el máximo, espera
   */
  async acquire(): Promise<Worker> {
    // Buscar worker idle disponible
    const idleWorker = this.findIdleWorker();
    if (idleWorker) {
      idleWorker.status = 'busy';
      idleWorker.lastUsed = Date.now();
      this.emitEvent({ type: 'worker:acquired', workerId: idleWorker.id, timestamp: Date.now() });
      return idleWorker;
    }

    // Crear nuevo worker si no hemos alcanzado el máximo
    if (this.workers.size < this.config.maxWorkers) {
      const worker = this.createWorker();
      worker.status = 'busy';
      this.emitEvent({ type: 'worker:acquired', workerId: worker.id, timestamp: Date.now() });
      return worker;
    }

    // Esperar a que se libere un worker
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  /**
   * Busca un worker en estado idle
   */
  private findIdleWorker(): Worker | undefined {
    for (const worker of this.workers.values()) {
      if (worker.status === 'idle') {
        return worker;
      }
    }
    return undefined;
  }

  /**
   * Libera un worker para reutilización
   * Recicla el worker si ha alcanzado el máximo de jobs
   */
  release(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.warn(`Worker ${workerId} no encontrado`);
      return;
    }

    // Limpiar job actual
    worker.currentJob = undefined;
    worker.lastUsed = Date.now();

    // Verificar si necesita reciclaje
    if (worker.jobsProcessed >= this.config.maxJobsPerWorker) {
      this.recycleWorker(workerId, 'maxJobs');
      return;
    }

    // Cambiar a idle si no hay error
    if (worker.status !== 'error') {
      worker.status = 'idle';
    }

    this.emitEvent({ 
      type: 'worker:released', 
      workerId: worker.id, 
      timestamp: Date.now(), 
      jobsProcessed: worker.jobsProcessed 
    });

    // Atender siguiente resolver en espera
    if (this.waitingResolvers.length > 0) {
      const idleWorker = this.findIdleWorker();
      if (idleWorker) {
        idleWorker.status = 'busy';
        const resolver = this.waitingResolvers.shift()!;
        resolver(idleWorker);
      }
    }

    // Procesar jobs pendientes en cola
    this.processQueue();
  }

  /**
   * Recicla un worker (lo elimina y crea uno nuevo si es necesario)
   */
  private recycleWorker(workerId: string, reason: 'maxJobs' | 'error' | 'idle'): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    this.emitEvent({ 
      type: 'worker:recycled', 
      workerId, 
      timestamp: Date.now(), 
      reason 
    });

    this.workers.delete(workerId);

    // Crear worker de reemplazo si estamos por debajo del mínimo
    if (this.workers.size < this.config.minWorkers) {
      this.createWorker();
    }

    // Notificar a los en espera
    this.notifyWaitingResolvers();
  }

  /**
   * Notifica a los resolvers en espera que pueden intentar adquirir
   */
  private notifyWaitingResolvers(): void {
    while (this.waitingResolvers.length > 0 && this.workers.size < this.config.maxWorkers) {
      const worker = this.createWorker();
      worker.status = 'busy';
      const resolver = this.waitingResolvers.shift()!;
      resolver(worker);
    }
  }

  /**
   * Ejecuta un job en un worker disponible
   */
  async execute(job: InferenceJob, provider: IAProvider): Promise<InferenceResult> {
    try {
      const worker = await this.acquire();
      worker.currentJob = job;

      const result = await this.runJobWithTimeout(worker, job, provider);
      
      // Actualizar estadísticas
      this.stats.jobsProcessed++;
      this.stats.totalExecutionTime += result.executionTimeMs;
      worker.jobsProcessed++;

      this.emitEvent({ 
        type: 'job:completed', 
        workerId: worker.id, 
        timestamp: Date.now(), 
        duration: result.executionTimeMs 
      });

      this.release(worker.id);
      return result;
    } catch (error) {
      this.stats.jobsFailed++;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitEvent({ 
        type: 'job:failed', 
        workerId: 'unknown', 
        timestamp: Date.now(), 
        error: errorMessage 
      });

      throw error;
    }
  }

  /**
   * Ejecuta un job con timeout
   */
  private async runJobWithTimeout(
    worker: Worker, 
    job: InferenceJob, 
    provider: IAProvider
  ): Promise<InferenceResult> {
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AIServiceError('Job timeout', 'TIMEOUT'));
      }, this.config.jobTimeoutMs);
    });

    try {
      const result = await Promise.race([
        this.runJob(worker, job, provider),
        timeoutPromise,
      ]);

      return {
        success: true,
        data: result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Marcar worker como error
      worker.status = 'error';
      worker.currentError = error instanceof Error ? error.message : String(error);
      this.emitEvent({ 
        type: 'worker:error', 
        workerId: worker.id, 
        timestamp: Date.now(), 
        error: worker.currentError 
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Ejecuta el job usando el provider
   */
  private async runJob(_worker: Worker, job: InferenceJob, provider: IAProvider): Promise<unknown> {
    switch (job.type) {
      case 'analyzeComment':
        return provider.analyzeComment(...(job.params as [string, string?]));
      case 'detectSpoiler':
        return provider.detectSpoiler(...(job.params as [string, string]));
      case 'summarizeChapter':
        return provider.summarizeChapter(...(job.params as [string]));
      case 'generateNotificationHook':
        return provider.generateNotificationHook(...(job.params as [string]));
      case 'generateEmbedding':
        return provider.generateEmbedding(...(job.params as [string]));
      case 'classifyGenre':
        return provider.classifyGenre(...(job.params as [string]));
      case 'classifyQuality':
        return provider.classifyQuality(...(job.params as [string]));
      default:
        throw new AIServiceError(`Unknown job type: ${(job as {type: string}).type}`, 'UNKNOWN_JOB_TYPE');
    }
  }

  /**
   * Procesa jobs pendientes en la cola
   */
  private processQueue(): void {
    while (this.jobQueue.length > 0) {
      const idleWorker = this.findIdleWorker();
      if (!idleWorker) break;

      const { job, provider, resolve, reject } = this.jobQueue.shift()!;
      
      idleWorker.status = 'busy';
      idleWorker.currentJob = job;

      this.runJobWithTimeout(idleWorker, job, provider)
        .then((result) => {
          this.stats.jobsProcessed++;
          this.stats.totalExecutionTime += result.executionTimeMs;
          idleWorker.jobsProcessed++;
          this.emitEvent({ 
            type: 'job:completed', 
            workerId: idleWorker.id, 
            timestamp: Date.now(), 
            duration: result.executionTimeMs 
          });
          this.release(idleWorker.id);
          resolve(result);
        })
        .catch((error) => {
          this.stats.jobsFailed++;
          this.emitEvent({ 
            type: 'job:failed', 
            workerId: idleWorker.id, 
            timestamp: Date.now(), 
            error: error instanceof Error ? error.message : String(error) 
          });
          reject(error);
        });
    }
  }

  /**
   * Aumenta el número de workers dinámicamente
   */
  scaleUp(count: number): void {
    const currentCount = this.workers.size;
    const targetCount = Math.min(currentCount + count, this.config.maxWorkers);
    const toCreate = targetCount - currentCount;

    for (let i = 0; i < toCreate; i++) {
      this.createWorker();
    }

    this.emitEvent({ type: 'pool:scaledUp', count: toCreate, timestamp: Date.now() });

    // Notificar a los en espera
    this.notifyWaitingResolvers();
  }

  /**
   * Reduce el número de workers cuando están idle
   * Elimina primero los workers que han estado idle por más tiempo
   */
  scaleDown(count: number): number {
    const idleWorkers: Worker[] = [];
    
    for (const worker of this.workers.values()) {
      if (worker.status === 'idle') {
        idleWorkers.push(worker);
      }
    }

    // Ordenar por lastUsed (más antiguos primero)
    idleWorkers.sort((a, b) => a.lastUsed - b.lastUsed);

    // Mantener al menos minWorkers
    const minIdleToKeep = Math.max(0, this.config.minWorkers - (this.workers.size - idleWorkers.length));
    const toRemove = Math.min(count, idleWorkers.length - minIdleToKeep);

    let removed = 0;
    for (let i = 0; i < toRemove; i++) {
      const worker = idleWorkers[i];
      this.workers.delete(worker.id);
      this.emitEvent({ 
        type: 'worker:recycled', 
        workerId: worker.id, 
        timestamp: Date.now(), 
        reason: 'idle' 
      });
      removed++;
    }

    if (removed > 0) {
      this.emitEvent({ type: 'pool:scaledDown', count: removed, timestamp: Date.now() });
    }

    return removed;
  }

  /**
   * Obtiene métricas del pool
   */
  getMetrics(): PoolMetrics {
    let activeWorkers = 0;
    let idleWorkers = 0;
    let busyWorkers = 0;
    let errorWorkers = 0;

    for (const worker of this.workers.values()) {
      activeWorkers++;
      switch (worker.status) {
        case 'idle':
          idleWorkers++;
          break;
        case 'busy':
          busyWorkers++;
          break;
        case 'error':
          errorWorkers++;
          break;
      }
    }

    const uptimeMs = Date.now() - this.stats.startTime;
    const minutesRunning = uptimeMs / 60000;
    const throughput = minutesRunning > 0 ? this.stats.jobsProcessed / minutesRunning : 0;

    return {
      activeWorkers,
      idleWorkers,
      busyWorkers,
      errorWorkers,
      queueSize: this.jobQueue.length,
      throughput: Math.round(throughput * 100) / 100,
      totalJobsProcessed: this.stats.jobsProcessed,
      totalJobsFailed: this.stats.jobsFailed,
      averageExecutionTimeMs: this.stats.jobsProcessed > 0 
        ? Math.round(this.stats.totalExecutionTime / this.stats.jobsProcessed) 
        : 0,
      uptimeMs,
    };
  }

  /**
   * Inicia health checks periódicos
   */
  private startHealthChecks(): void {
    const interval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckIntervalMs);
    
    this.timers.push(interval);
  }

  /**
   * Realiza health checks de todos los workers
   */
  private performHealthChecks(): void {
    const now = Date.now();

    for (const worker of this.workers.values()) {
      // Verificar si el worker lleva mucho tiempo en estado error
      if (worker.status === 'error') {
        const timeInError = now - worker.lastUsed;
        // Reciclar workers en error por más de 5 minutos
        if (timeInError > 300000) {
          this.recycleWorker(worker.id, 'error');
        }
        continue;
      }

      // Verificar si un worker busy lleva demasiado tiempo
      if (worker.status === 'busy' && worker.currentJob) {
        const executionTime = now - worker.lastUsed;
        if (executionTime > this.config.jobTimeoutMs * 2) {
          worker.status = 'error';
          worker.currentError = 'Worker stuck processing job';
          this.emitEvent({ 
            type: 'worker:healthCheck:failed', 
            workerId: worker.id, 
            timestamp: now, 
            error: worker.currentError 
          });
        }
      }

      worker.lastHealthCheck = now;
      this.emitEvent({ 
        type: 'worker:healthCheck:passed', 
        workerId: worker.id, 
        timestamp: now 
      });
    }
  }

  /**
   * Inicia el auto-cleanup de workers idle
   */
  private startIdleCleanup(): void {
    const interval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, Math.min(this.config.idleTimeoutMs, 300000)); // Máximo cada 5 minutos

    this.timers.push(interval);
  }

  /**
   * Limpia workers que han estado idle por mucho tiempo
   */
  private cleanupIdleWorkers(): void {
    const now = Date.now();
    const workersToRecycle: string[] = [];

    for (const worker of this.workers.values()) {
      if (worker.status === 'idle') {
        const idleTime = now - worker.lastUsed;
        if (idleTime > this.config.idleTimeoutMs && this.workers.size > this.config.minWorkers) {
          workersToRecycle.push(worker.id);
        }
      }
    }

    for (const workerId of workersToRecycle) {
      this.recycleWorker(workerId, 'idle');
    }
  }

  /**
   * Libera recursos y detiene el pool
   */
  shutdown(): void {
    // Limpiar timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];

    // Limpiar workers
    this.workers.clear();

    // Rechazar jobs pendientes
    while (this.jobQueue.length > 0) {
      const { reject } = this.jobQueue.shift()!;
      reject(new AIServiceError('Pool shutting down', 'POOL_SHUTDOWN'));
    }

    // Limpiar resolvers en espera
    this.waitingResolvers = [];
  }

  /**
   * Obtiene el número actual de workers
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  /**
   * Obtiene información de un worker específico
   */
  getWorker(workerId: string): Worker | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Obtiene todos los workers
   */
  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }
}
