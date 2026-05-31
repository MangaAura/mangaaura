/**
 * Redis Circuit Breaker
 *
 * Monitorea la salud de la conexión Redis y evita que los workers
 * sigan intentando procesar jobs cuando Redis está caído.
 *
 * Estados:
 *   CLOSED   → Operación normal (Redis disponible)
 *   OPEN     → Redis caído, workers degradan a mock mode
 *   HALF_OPEN → Esperando ver si Redis se recuperó
 *
 * @packageDocumentation
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  /** Número de fallos consecutivos antes de abrir el circuito */
  failureThreshold: number;
  /** Tiempo en ms antes de pasar a HALF_OPEN */
  cooldownMs: number;
  /** Tiempo en ms entre health checks en modo OPEN */
  healthCheckIntervalMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownMs: 30_000,        // 30s antes de reintentar
  healthCheckIntervalMs: 15_000, // health check cada 15s
};

export class RedisCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private lastHealthCheckTime = 0;
  private config: CircuitBreakerConfig;
  private totalFailures = 0;
  private totalRecoveries = 0;
  private lastError: string | null = null;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): CircuitState {
    // Auto-transition from OPEN → HALF_OPEN after cooldown
    if (
      this.state === 'OPEN' &&
      Date.now() - this.lastFailureTime >= this.config.cooldownMs
    ) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  /**
   * Clasifica un error como transitorio (puede recuperarse) vs permanente.
   * Errores permanentes abren el circuito inmediatamente.
   */
  private classifyError(error: Error | string): 'transient' | 'permanent' {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMsg = message.toLowerCase();

    // Errores de conexión/red → transitorios
    if (
      lowerMsg.includes('econnrefused') ||
      lowerMsg.includes('etimedout') ||
      lowerMsg.includes('econnreset') ||
      lowerMsg.includes('enotfound') ||
      lowerMsg.includes('connection refused') ||
      lowerMsg.includes('connection timeout') ||
      lowerMsg.includes('socket') ||
      lowerMsg.includes('network') ||
      lowerMsg.includes('max retries') ||
      lowerMsg.includes('reconnect')
    ) {
      return 'transient';
    }

    // Errores de autenticación/config → permanentes
    if (
      lowerMsg.includes('auth') ||
      lowerMsg.includes('unauthorized') ||
      lowerMsg.includes('forbidden') ||
      lowerMsg.includes('permission') ||
      lowerMsg.includes('invalid password') ||
      lowerMsg.includes('wrongtype') ||
      lowerMsg.includes('noauth') ||
      lowerMsg.includes('readycheck')
    ) {
      return 'permanent';
    }

    // Por defecto, cualquier error de Redis se considera transitorio
    return 'transient';
  }

  /**
   * Registra un fallo — puede abrir el circuito si se excede el threshold.
   * Los errores de tipo 'permanent' abren el circuito inmediatamente.
   */
  recordFailure(error: Error | string): void {
    const classification = this.classifyError(error);

    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.lastError = typeof error === 'string' ? error : error.message;

    // Errores permanentes: abrir inmediatamente
    if (classification === 'permanent') {
      this.state = 'OPEN';
      this.lastHealthCheckTime = Date.now(); // Reset health check timer
      return;
    }

    // Errores transitorios: abrir solo si se excede el threshold
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.lastHealthCheckTime = Date.now(); // Reset health check timer
    }
  }

  /** Obtiene la última clasificación de error */
  getLastErrorClassification(): 'transient' | 'permanent' | null {
    if (!this.lastError) return null;
    return this.classifyError(this.lastError);
  }

  /** Registra un éxito — cierra el circuito */
  recordSuccess(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastError = null;
    this.totalRecoveries++;
  }

  /** Marca como recuperado (desde HALF_OPEN si un health check pasa) */
  recover(): void {
    if (this.state === 'HALF_OPEN' || this.state === 'OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.lastFailureTime = 0;
      this.lastError = null;
      this.totalRecoveries++;
    }
  }

  /**
   * Indica si es momento de hacer un health check de Redis.
   * Llamado por el sistema de monitoreo externo (no usado internamente aún).
   * @internal
   */
  shouldHealthCheck(): boolean {
    if (
      this.state === 'OPEN' &&
      Date.now() - this.lastHealthCheckTime >= this.config.healthCheckIntervalMs
    ) {
      this.lastHealthCheckTime = Date.now();
      return true;
    }
    return false;
  }

  /** Resetea el breaker a estado inicial */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastHealthCheckTime = 0;
    this.lastError = null;
  }

  /** Obtiene métricas para monitoreo */
  getMetrics(): {
    state: CircuitState;
    failureCount: number;
    totalFailures: number;
    totalRecoveries: number;
    lastError: string | null;
    lastErrorClassification: 'transient' | 'permanent' | null;
    lastFailureTime: number;
    uptimeSinceLastRecovery: number;
  } {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      totalFailures: this.totalFailures,
      totalRecoveries: this.totalRecoveries,
      lastError: this.lastError,
      lastErrorClassification: this.getLastErrorClassification(),
      lastFailureTime: this.lastFailureTime,
      uptimeSinceLastRecovery:
        this.state === 'CLOSED' && this.totalRecoveries > 0
          ? Date.now() - this.lastFailureTime
          : 0,
    };
  }
}

// Singleton global compartido por todos los workers
let globalCircuitBreaker: RedisCircuitBreaker | null = null;

export function getRedisCircuitBreaker(): RedisCircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new RedisCircuitBreaker();
  }
  return globalCircuitBreaker;
}

export function resetRedisCircuitBreaker(): void {
  globalCircuitBreaker = null;
}
