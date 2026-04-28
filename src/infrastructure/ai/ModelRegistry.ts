/**
 * ModelRegistry - Sistema de registro y enrutamiento de modelos de IA
 *
 * Este módulo proporciona un registro centralizado para modelos de IA,
 * con capacidades de health checking y estrategias de enrutamiento.
 */

import { EventEmitter } from 'events';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Capacidades soportadas por los modelos
 */
export type ModelCapability =
  | 'chat'
  | 'embedding'
  | 'classification'
  | 'summarization'
  | 'image-generation';

/**
 * Estado de salud de un modelo
 */
export type ModelHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Configuración del modelo
 */
export interface ModelConfig {
  /** URL base del endpoint del modelo */
  baseUrl?: string;
  /** API Key (encriptada) */
  apiKey?: string;
  /** Límite de requests por minuto */
  maxRequestsPerMinute?: number;
  /** Máximo de tokens de contexto */
  contextWindow?: number;
  /** Temperatura por defecto */
  defaultTemperature?: number;
  /** Timeout en ms */
  timeoutMs?: number;
  /** Peso para estrategias ponderadas (mayor = más probabilidad de selección) */
  weight?: number;
  /** Metadata adicional */
  metadata?: Record<string, unknown>;
}

/**
 * Modelo registrado en el sistema
 */
export interface RegisteredModel {
  /** ID único del modelo (ej: 'nvidia/llama-3.1-nemotron-70b') */
  id: string;
  /** Nombre legible del modelo */
  name: string;
  /** Proveedor del servicio (ej: 'nvidia', 'openai', 'anthropic') */
  provider: string;
  /** Capacidades que soporta este modelo */
  capabilities: ModelCapability[];
  /** Configuración específica del modelo */
  config: ModelConfig;
  /** Estado actual del modelo */
  status: {
    health: ModelHealthStatus;
    /** Última latencia medida en ms */
    lastLatencyMs?: number;
    /** Timestamp del último health check */
    lastHealthCheck?: Date;
    /** Número de requests fallidos consecutivos */
    consecutiveFailures: number;
    /** Número total de requests exitosos */
    totalSuccessfulRequests: number;
    /** Número total de requests fallidos */
    totalFailedRequests: number;
  };
  /** Timestamp de registro */
  registeredAt: Date;
}

/**
 * Estrategias de enrutamiento disponibles
 */
export type RoutingStrategy =
  | 'round-robin'
  | 'least-latency'
  | 'capability-match'
  | 'fallback-chain'
  | 'weighted-random';

/**
 * Estrategia de enrutamiento de modelos
 */
export interface ModelRoutingStrategy {
  /** Nombre de la estrategia */
  readonly name: RoutingStrategy;
  /** Selecciona un modelo basado en la estrategia */
  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null;
}

/**
 * Métricas de enrutamiento para un modelo específico
 */
export interface ModelRoutingMetrics {
  modelId: string;
  modelName: string;
  provider: string;
  /** Total de requests procesados */
  totalRequests: number;
  /** Requests exitosos */
  successfulRequests: number;
  /** Requests fallidos */
  failedRequests: number;
  /** Tasa de éxito (0-1) */
  successRate: number;
  /** Latencia promedio en ms */
  averageLatencyMs: number;
  /** Latencia del último request en ms */
  lastLatencyMs?: number;
  /** Estado de salud actual */
  healthStatus: ModelHealthStatus;
}

/**
 * Métricas globales del sistema de enrutamiento
 */
export interface RoutingMetrics {
  /** Métricas por modelo */
  models: ModelRoutingMetrics[];
  /** Total de modelos registrados */
  totalRegisteredModels: number;
  /** Modelos saludables */
  healthyModelsCount: number;
  /** Estrategia de enrutamiento actual */
  currentStrategy: RoutingStrategy;
  /** Timestamp de la última actualización de métricas */
  lastUpdated: Date;
}

// =============================================================================
// IMPLEMENTACIONES DE ESTRATEGIAS
// =============================================================================

class RoundRobinStrategy implements ModelRoutingStrategy {
  readonly name: RoutingStrategy = 'round-robin';
  private currentIndex = 0;

  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    if (models.length === 0) return null;

    const eligibleModels = this.filterEligible(models, requirements);
    if (eligibleModels.length === 0) return null;

    const selected = eligibleModels[this.currentIndex % eligibleModels.length];
    this.currentIndex = (this.currentIndex + 1) % eligibleModels.length;

    return selected;
  }

  private filterEligible(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel[] {
    return models.filter(
      (m) =>
        m.status.health === 'healthy' &&
        requirements.every((req) => m.capabilities.includes(req))
    );
  }
}

class LeastLatencyStrategy implements ModelRoutingStrategy {
  readonly name: RoutingStrategy = 'least-latency';

  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    const eligibleModels = models.filter(
      (m) =>
        m.status.health === 'healthy' &&
        requirements.every((req) => m.capabilities.includes(req)) &&
        m.status.lastLatencyMs !== undefined
    );

    if (eligibleModels.length === 0) return null;

    // Ordenar por latencia (menor primero)
    eligibleModels.sort((a, b) => {
      const latencyA = a.status.lastLatencyMs ?? Infinity;
      const latencyB = b.status.lastLatencyMs ?? Infinity;
      return latencyA - latencyB;
    });

    return eligibleModels[0];
  }
}

class CapabilityMatchStrategy implements ModelRoutingStrategy {
  readonly name: RoutingStrategy = 'capability-match';

  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    if (requirements.length === 0) return null;

    // Buscar modelos que tengan TODAS las capacidades requeridas
    const eligibleModels = models.filter(
      (m) =>
        m.status.health === 'healthy' &&
        requirements.every((req) => m.capabilities.includes(req))
    );

    if (eligibleModels.length === 0) return null;

    // Priorizar modelos con menos capacidades extra (match más específico)
    eligibleModels.sort((a, b) => a.capabilities.length - b.capabilities.length);

    return eligibleModels[0];
  }
}

class FallbackChainStrategy implements ModelRoutingStrategy {
  readonly name: RoutingStrategy = 'fallback-chain';
  /** Lista de modelos en orden de preferencia para fallback */
  fallbackOrder: string[] = [];

  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    if (this.fallbackOrder.length === 0) {
      // Si no hay orden definido, usar el primero que cumpla
      return (
        models.find(
          (m) =>
            m.status.health === 'healthy' &&
            requirements.every((req) => m.capabilities.includes(req))
        ) || null
      );
    }

    // Buscar en orden de fallback
    for (const modelId of this.fallbackOrder) {
      const model = models.find(
        (m) =>
          m.id === modelId &&
          m.status.health === 'healthy' &&
          requirements.every((req) => m.capabilities.includes(req))
      );
      if (model) return model;
    }

    return null;
  }

  /**
   * Configura el orden de fallback
   */
  setFallbackOrder(order: string[]): void {
    this.fallbackOrder = [...order];
  }
}

class WeightedRandomStrategy implements ModelRoutingStrategy {
  readonly name: RoutingStrategy = 'weighted-random';

  select(
    models: RegisteredModel[],
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    const eligibleModels = models.filter(
      (m) =>
        m.status.health === 'healthy' &&
        requirements.every((req) => m.capabilities.includes(req))
    );

    if (eligibleModels.length === 0) return null;

    // Calcular pesos totales
    const totalWeight = eligibleModels.reduce(
      (sum, m) => sum + (m.config.weight || 1),
      0
    );

    // Selección ponderada aleatoria
    let random = Math.random() * totalWeight;

    for (const model of eligibleModels) {
      random -= model.config.weight || 1;
      if (random <= 0) return model;
    }

    // Fallback al último si hay errores de redondeo
    return eligibleModels[eligibleModels.length - 1];
  }
}

// =============================================================================
// REGISTRY IMPLEMENTATION
// =============================================================================

export class ModelRegistry extends EventEmitter {
  private models: Map<string, RegisteredModel> = new Map();
  private strategies: Map<RoutingStrategy, ModelRoutingStrategy> = new Map();
  private currentStrategy: RoutingStrategy = 'round-robin';

  // Instancias de estrategias
  private roundRobinStrategy = new RoundRobinStrategy();
  private leastLatencyStrategy = new LeastLatencyStrategy();
  private capabilityMatchStrategy = new CapabilityMatchStrategy();
  private fallbackChainStrategy = new FallbackChainStrategy();
  private weightedRandomStrategy = new WeightedRandomStrategy();

  constructor() {
    super();
    this.setMaxListeners(50);

    // Registrar todas las estrategias
    this.strategies.set('round-robin', this.roundRobinStrategy);
    this.strategies.set('least-latency', this.leastLatencyStrategy);
    this.strategies.set('capability-match', this.capabilityMatchStrategy);
    this.strategies.set('fallback-chain', this.fallbackChainStrategy);
    this.strategies.set('weighted-random', this.weightedRandomStrategy);
  }

  // ===========================================================================
  // MÉTODOS DE REGISTRO
  // ===========================================================================

  /**
   * Registra un nuevo modelo en el sistema
   */
  register(model: RegisteredModel): void {
    if (!model.id) {
      throw new Error('Model ID is required');
    }

    if (this.models.has(model.id)) {
      throw new Error(`Model with ID '${model.id}' is already registered`);
    }

    // Validar que tenga al menos una capacidad
    if (!model.capabilities || model.capabilities.length === 0) {
      throw new Error('Model must have at least one capability');
    }

    // Asegurar que el status esté completo
    const modelWithDefaults: RegisteredModel = {
      ...model,
      status: {
        health: model.status?.health ?? 'unknown',
        consecutiveFailures: model.status?.consecutiveFailures ?? 0,
        totalSuccessfulRequests: model.status?.totalSuccessfulRequests ?? 0,
        totalFailedRequests: model.status?.totalFailedRequests ?? 0,
        lastHealthCheck: model.status?.lastHealthCheck,
        lastLatencyMs: model.status?.lastLatencyMs,
      },
      registeredAt: model.registeredAt ?? new Date(),
    };

    this.models.set(model.id, modelWithDefaults);
  }

  /**
   * Desregistra un modelo del sistema
   */
  unregister(modelId: string): void {
    if (!this.models.has(modelId)) {
      throw new Error(`Model with ID '${modelId}' is not registered`);
    }

    this.models.delete(modelId);
  }

  // ===========================================================================
  // MÉTODOS DE CONSULTA
  // ===========================================================================

  /**
   * Obtiene un modelo por su ID
   */
  getModel(modelId: string): RegisteredModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Obtiene todos los modelos registrados
   */
  getAllModels(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Busca modelos que tengan todas las capacidades especificadas
   */
  findModels(capabilities: ModelCapability[]): RegisteredModel[] {
    return Array.from(this.models.values()).filter((model) =>
      capabilities.every((cap) => model.capabilities.includes(cap))
    );
  }

  /**
   * Obtiene todos los modelos saludables (health check pasado)
   */
  getHealthyModels(): RegisteredModel[] {
    return Array.from(this.models.values()).filter(
      (model) => model.status.health === 'healthy'
    );
  }

  /**
   * Obtiene modelos por proveedor
   */
  getModelsByProvider(provider: string): RegisteredModel[] {
    return Array.from(this.models.values()).filter(
      (model) => model.provider === provider
    );
  }

  // ===========================================================================
  // HEALTH CHECK & STATUS
  // ===========================================================================

  /**
   * Actualiza el estado de salud de un modelo
   */
  updateHealth(
    modelId: string,
    isHealthy: boolean,
    latencyMs?: number
  ): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model with ID '${modelId}' is not registered`);
    }

    const previousHealth = model.status.health;
    const now = new Date();

    // Actualizar salud
    model.status.lastHealthCheck = now;

    if (latencyMs !== undefined) {
      model.status.lastLatencyMs = latencyMs;
    }

    if (isHealthy) {
      model.status.health = 'healthy';
      model.status.consecutiveFailures = 0;
      model.status.totalSuccessfulRequests++;
    } else {
      model.status.consecutiveFailures++;
      model.status.totalFailedRequests++;

      // Degradar salud basado en fallos consecutivos
      if (model.status.consecutiveFailures >= 5) {
        model.status.health = 'unhealthy';
      } else if (model.status.consecutiveFailures >= 2) {
        model.status.health = 'degraded';
      }
    }

    // Emitir evento si el estado de salud cambió
    if (previousHealth !== model.status.health) {
      this.emit('model:health-changed', {
        modelId: model.id,
        modelName: model.name,
        previousHealth,
        newHealth: model.status.health,
        consecutiveFailures: model.status.consecutiveFailures,
        timestamp: now,
      });
    }
  }

  /**
   * Marca un modelo como degradado
   */
  markDegraded(modelId: string, reason?: string): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model with ID '${modelId}' is not registered`);
    }

    model.status.health = 'degraded';
    model.status.lastHealthCheck = new Date();

    if (reason) {
      // Guardar el motivo en metadata si existe
      if (!model.config.metadata) {
        model.config.metadata = {};
      }
      model.config.metadata.lastDegradedReason = reason;
    }
  }

  // ===========================================================================
  // ROUTING
  // ===========================================================================

  /**
   * Selecciona un modelo basado en la estrategia de enrutamiento
   */
  selectModel(
    strategy: RoutingStrategy,
    requirements: ModelCapability[]
  ): RegisteredModel | null {
    const healthyModels = this.getHealthyModels();

    if (healthyModels.length === 0) {
      return null;
    }

    const strategyImpl = this.strategies.get(strategy);
    if (!strategyImpl) {
      throw new Error(`Unknown routing strategy: ${strategy}`);
    }

    this.currentStrategy = strategy;

    return strategyImpl.select(healthyModels, requirements);
  }

  /**
   * Configura el orden de fallback para la estrategia fallback-chain
   */
  setFallbackChain(order: string[]): void {
    this.fallbackChainStrategy.setFallbackOrder(order);
  }

  /**
   * Obtiene la estrategia de enrutamiento actual
   */
  getCurrentStrategy(): RoutingStrategy {
    return this.currentStrategy;
  }

  // ===========================================================================
  // MÉTRICAS
  // ===========================================================================

  /**
   * Obtiene métricas de uso del sistema de enrutamiento
   */
  getRoutingMetrics(): RoutingMetrics {
    const allModels = this.getAllModels();
    const healthyModels = this.getHealthyModels();

    const modelMetrics: ModelRoutingMetrics[] = allModels.map((model) => {
      const totalRequests =
        model.status.totalSuccessfulRequests + model.status.totalFailedRequests;

      const successRate =
        totalRequests > 0
          ? model.status.totalSuccessfulRequests / totalRequests
          : 0;

      // Calcular latencia promedio (simplificado, usaríamos histórico real en producción)
      const averageLatencyMs =
        model.status.lastLatencyMs ??
        (model.status.health === 'healthy' ? 100 : 500);

      return {
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        totalRequests,
        successfulRequests: model.status.totalSuccessfulRequests,
        failedRequests: model.status.totalFailedRequests,
        successRate: Math.round(successRate * 100) / 100,
        averageLatencyMs,
        lastLatencyMs: model.status.lastLatencyMs,
        healthStatus: model.status.health,
      };
    });

    // Ordenar por tasa de éxito descendente
    modelMetrics.sort((a, b) => b.successRate - a.successRate);

    return {
      models: modelMetrics,
      totalRegisteredModels: allModels.length,
      healthyModelsCount: healthyModels.length,
      currentStrategy: this.currentStrategy,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtiene métricas de un modelo específico
   */
  getModelMetrics(modelId: string): ModelRoutingMetrics | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const totalRequests =
      model.status.totalSuccessfulRequests + model.status.totalFailedRequests;

    const successRate =
      totalRequests > 0
        ? model.status.totalSuccessfulRequests / totalRequests
        : 0;

    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      totalRequests,
      successfulRequests: model.status.totalSuccessfulRequests,
      failedRequests: model.status.totalFailedRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageLatencyMs: model.status.lastLatencyMs ?? 0,
      lastLatencyMs: model.status.lastLatencyMs,
      healthStatus: model.status.health,
    };
  }

  /**
   * Reinicia las métricas de un modelo
   */
  resetModelMetrics(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model with ID '${modelId}' is not registered`);
    }

    model.status.totalSuccessfulRequests = 0;
    model.status.totalFailedRequests = 0;
    model.status.consecutiveFailures = 0;
  }

  // ===========================================================================
  // UTILIDADES
  // ===========================================================================

  /**
   * Limpia todos los modelos registrados (útil para tests)
   */
  clear(): void {
    this.models.clear();
    this.currentStrategy = 'round-robin';
    this.fallbackChainStrategy.setFallbackOrder([]);
  }

  /**
   * Verifica si un modelo existe
   */
  hasModel(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /**
   * Obtiene el número total de modelos registrados
   */
  get size(): number {
    return this.models.size;
  }
}

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default ModelRegistry;
