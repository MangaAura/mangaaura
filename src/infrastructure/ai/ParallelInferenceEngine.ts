/**
 * ParallelInferenceEngine - Sistema de inferencia paralela
 * Ejecuta múltiples jobs de inferencia en paralelo con soporte para:
 * - Concurrencia controlada
 * - Manejo de timeouts
 * - Retry automático con backoff exponencial
 * - Fallback a modelos alternativos
 */

// ============================================================================
// INTERFACES PÚBLICAS
// ============================================================================

/**
 * Job de inferencia individual
 */
export interface InferenceJob {
  /** Identificador único del job */
  id: string;
  /** ID del modelo a usar */
  modelId: string;
  /** Datos de entrada para la inferencia */
  input: string | Record<string, unknown> | unknown[];
  /** Prioridad del job (menor número = mayor prioridad) */
  priority?: number;
  /** Timeout en milisegundos (opcional) */
  timeout?: number;
}

/**
 * Resultado de un job de inferencia
 */
export interface InferenceResult {
  /** ID del job correspondiente */
  jobId: string;
  /** Resultado de la inferencia (undefined si hubo error) */
  output?: string | Record<string, unknown> | unknown[];
  /** Latencia en milisegundos */
  latencyMs: number;
  /** Error si ocurrió (undefined si fue exitoso) */
  error?: InferenceError;
}

/**
 * Error de inferencia estructurado
 */
export interface InferenceError {
  /** Mensaje descriptivo del error */
  message: string;
  /** Código de error opcional */
  code?: string;
  /** Modelo que causó el error (para fallback tracking) */
  modelId?: string;
  /** Indica si el error es recuperable (retryable) */
  retryable: boolean;
}

/**
 * Estadísticas del motor de inferencia
 */
export interface InferenceStats {
  /** Total de jobs procesados */
  totalJobs: number;
  /** Total de jobs exitosos */
  successfulJobs: number;
  /** Total de jobs fallidos */
  failedJobs: number;
  /** Tasa de éxito (0-1) */
  successRate: number;
  /** Latencia promedio en ms */
  avgLatency: number;
  /** Latencia mínima registrada */
  minLatency: number;
  /** Latencia máxima registrada */
  maxLatency: number;
  /** Jobs actualmente en ejecución */
  activeJobs: number;
}

/**
 * Configuración del motor de inferencia
 */
export interface ParallelInferenceEngineConfig {
  /** Número máximo de jobs concurrentes */
  maxConcurrent: number;
  /** Timeout por defecto en ms (default: 30000) */
  defaultTimeout?: number;
  /** Número máximo de reintentos (default: 3) */
  maxRetries?: number;
  /** Factor de backoff exponencial (default: 2) */
  backoffFactor?: number;
  /** Delay inicial de backoff en ms (default: 1000) */
  initialBackoffMs?: number;
}

/**
 * Interfaz abstracta para providers de inferencia
 * Permite que el motor sea independiente del provider específico
 */
export interface InferenceProvider {
  /** Ejecuta inferencia con el modelo especificado */
  infer(modelId: string, input: InferenceJob['input']): Promise<unknown>;
  /** Verifica si el provider está disponible */
  isAvailable(): Promise<boolean>;
}

/**
 * Factory para crear providers de inferencia
 */
export type InferenceProviderFactory = (modelId: string) => InferenceProvider;

// ============================================================================
// IMPLEMENTACIÓN
// ============================================================================

/**
 * Motor de inferencia paralela
 * 
 * Ejemplo de uso:
 * ```typescript
 * const engine = new ParallelInferenceEngine(
 *   { maxConcurrent: 10 },
 *   (modelId) => new MyInferenceProvider(modelId)
 * );
 * 
 * const results = await engine.executeBatch([
 *   { id: '1', modelId: 'nvidia/llama-3.1-nemotron-70b', input: '...', priority: 1 },
 *   { id: '2', modelId: 'nvidia/nv-embedqa-e5-v5', input: '...', priority: 2 }
 * ]);
 * ```
 */
export class ParallelInferenceEngine {
  private readonly config: Required<ParallelInferenceEngineConfig>;
  private readonly providerFactory: InferenceProviderFactory;
  private activeJobs = 0;
  private stats = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    totalLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
  };

  constructor(
    config: ParallelInferenceEngineConfig,
    providerFactory: InferenceProviderFactory
  ) {
    this.config = {
      maxConcurrent: config.maxConcurrent,
      defaultTimeout: config.defaultTimeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      backoffFactor: config.backoffFactor ?? 2,
      initialBackoffMs: config.initialBackoffMs ?? 1000,
    };
    this.providerFactory = providerFactory;
  }

  /**
   * Ejecuta múltiples jobs de inferencia en paralelo
   * 
   * @param jobs - Array de jobs a ejecutar
   * @returns Promise con los resultados de todos los jobs
   */
  async executeBatch(jobs: InferenceJob[]): Promise<InferenceResult[]> {
    if (jobs.length === 0) {
      return [];
    }

    // Ordenar por prioridad (menor número primero)
    const sortedJobs = [...jobs].sort(
      (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity)
    );

    // Ejecutar con control de concurrencia
    const results: InferenceResult[] = [];
    const executing: Promise<void>[] = [];

    for (const job of sortedJobs) {
      // Esperar si alcanzamos el límite de concurrencia
      while (this.activeJobs >= this.config.maxConcurrent) {
        await Promise.race(executing);
      }

      // Ejecutar el job
      const execution = this.executeSingleJob(job).then((result) => {
        results.push(result);
        this.removeFromExecuting(executing, execution);
      });

      executing.push(execution);
    }

    // Esperar a que terminen todos los jobs pendientes
    await Promise.all(executing);

    // Reordenar resultados según el orden original de los jobs
    const resultMap = new Map(results.map((r) => [r.jobId, r]));
    return jobs.map((job) => resultMap.get(job.id)!).filter(Boolean);
  }

  /**
   * Ejecuta un job con soporte para fallback a modelos alternativos
   * 
   * @param job - Job a ejecutar
   * @param fallbackModels - Lista de modelos de respaldo en orden de preferencia
   * @returns Resultado de la inferencia
   * 
   * @example
   * ```typescript
   * const result = await engine.executeWithFallback(
   *   { id: '1', modelId: 'primary-model', input: 'hello' },
   *   ['backup-model-1', 'backup-model-2']
   * );
   * ```
   */
  async executeWithFallback(
    job: InferenceJob,
    fallbackModels: string[]
  ): Promise<InferenceResult> {
    const modelsToTry = [job.modelId, ...fallbackModels];
    const errors: InferenceError[] = [];

    for (const modelId of modelsToTry) {
      const jobWithModel: InferenceJob = { ...job, modelId };
      const result = await this.executeSingleJob(jobWithModel);

      if (!result.error) {
        return result;
      }

      errors.push(result.error);
    }

    // Todos los modelos fallaron
    return {
      jobId: job.id,
      latencyMs: errors.reduce((sum, e) => sum + (e.modelId ? 0 : 0), 0),
      error: {
        message: `All models failed. Errors: ${errors.map((e) => e.message).join('; ')}`,
        code: 'ALL_MODELS_FAILED',
        modelId: job.modelId,
        retryable: false,
      },
    };
  }

  /**
   * Obtiene estadísticas actuales del motor
   * 
   * @returns Estadísticas de ejecución
   */
  getStats(): InferenceStats {
    const total = this.stats.totalJobs;
    return {
      totalJobs: total,
      successfulJobs: this.stats.successfulJobs,
      failedJobs: this.stats.failedJobs,
      successRate: total > 0 ? this.stats.successfulJobs / total : 0,
      avgLatency: total > 0 ? this.stats.totalLatency / total : 0,
      minLatency: total > 0 ? this.stats.minLatency : 0,
      maxLatency: this.stats.maxLatency,
      activeJobs: this.activeJobs,
    };
  }

  /**
   * Resetea las estadísticas acumuladas
   */
  resetStats(): void {
    this.stats = {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      totalLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
    };
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Ejecuta un único job con retry y timeout
   */
  private async executeSingleJob(job: InferenceJob): Promise<InferenceResult> {
    const startTime = performance.now();
    this.activeJobs++;
    this.stats.totalJobs++;

    try {
      const result = await this.executeWithRetry(job);
      const latencyMs = Math.round(performance.now() - startTime);
      
      this.updateStats(latencyMs, true);
      this.activeJobs--;

      return {
        jobId: job.id,
        output: result,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.updateStats(latencyMs, false);
      this.activeJobs--;

      return {
        jobId: job.id,
        latencyMs,
        error: this.normalizeError(error, job.modelId),
      };
    }
  }

  /**
   * Ejecuta con reintentos automáticos y backoff exponencial
   */
  private async executeWithRetry(job: InferenceJob): Promise<unknown> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const provider = this.providerFactory(job.modelId);
        
        // Verificar disponibilidad del provider
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          throw new Error(`Provider for model ${job.modelId} is not available`);
        }

        // Ejecutar con timeout
        const timeoutMs = job.timeout ?? this.config.defaultTimeout;
        return await this.executeWithTimeout(
          () => provider.infer(job.modelId, job.input),
          timeoutMs
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const inferenceError = this.normalizeError(error, job.modelId);
        
        // Si no es recuperable o es el último intento, propagar el error
        if (!inferenceError.retryable || attempt === this.config.maxRetries) {
          throw lastError;
        }

        // Calcular delay de backoff exponencial
        const delayMs = this.config.initialBackoffMs * Math.pow(this.config.backoffFactor, attempt);
        await this.sleep(delayMs);
      }
    }

    throw lastError ?? new Error('Unknown error after retries');
  }

  /**
   * Ejecuta una función con timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Normaliza un error a la interfaz InferenceError
   */
  private normalizeError(error: unknown, modelId?: string): InferenceError {
    const message = error instanceof Error ? error.message : String(error);

    // Extraer código de error si existe
    const code = this.extractErrorCode(error);

    // Determinar si es retryable (revisar mensaje y código)
    const retryable = this.isRetryableError(message, code);

    return {
      message,
      code,
      modelId,
      retryable,
    };
  }

  /**
   * Determina si un error es recuperable (debería reintentarse)
   */
  private isRetryableError(message: string, code?: string): boolean {
    const nonRetryablePatterns = [
      'INVALID_API_KEY',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'BAD_REQUEST',
      'RATE_LIMIT_EXCEEDED',
    ];

    const retryablePatterns = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
    ];

    // Check code first if available
    if (code) {
      const upperCode = code.toUpperCase();
      if (nonRetryablePatterns.some((p) => upperCode.includes(p))) {
        return false;
      }
      if (retryablePatterns.some((p) => upperCode.includes(p))) {
        return true;
      }
    }

    const upperMessage = message.toUpperCase();

    if (nonRetryablePatterns.some((p) => upperMessage.includes(p))) {
      return false;
    }

    return retryablePatterns.some((p) => upperMessage.includes(p));
  }

  /**
   * Extrae código de error si existe
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (typeof err.code === 'string') {
        return err.code;
      }
    }
    return undefined;
  }

  /**
   * Actualiza las estadísticas
   */
  private updateStats(latencyMs: number, success: boolean): void {
    if (success) {
      this.stats.successfulJobs++;
    } else {
      this.stats.failedJobs++;
    }

    this.stats.totalLatency += latencyMs;
    this.stats.minLatency = Math.min(this.stats.minLatency, latencyMs);
    this.stats.maxLatency = Math.max(this.stats.maxLatency, latencyMs);
  }

  /**
   * Remueve una promesa del array de ejecución
   */
  private removeFromExecuting(
    executing: Promise<void>[],
    promise: Promise<void>
  ): void {
    const index = executing.indexOf(promise);
    if (index > -1) {
      executing.splice(index, 1);
    }
  }

  /**
   * Utilidad para esperar un tiempo específico
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// EXPORTS ADICIONALES
// ============================================================================

export default ParallelInferenceEngine;
