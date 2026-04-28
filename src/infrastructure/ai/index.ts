/**
 * AI Infrastructure Exports
 *
 * Este módulo exporta todos los componentes del sistema de IA:
 * - Providers: NVIDIA, InMemory
 * - Registry: Registro de modelos
 * - Engine: Motor de inferencia paralela
 * - Worker Pool: Pool de workers
 * - Unified Service: Servicio unificado
 * - Alert Manager: Sistema de alertas
 */

// Providers
export { NVIDIAProvider } from './NVIDIAProvider';
export { InMemoryAIProvider } from './InMemoryAIProvider';

// Registry & Routing
export {
  ModelRegistry,
  type ModelCapability,
  type ModelConfig,
  type ModelHealthStatus,
  type RegisteredModel,
  type RoutingStrategy,
  type ModelRoutingStrategy,
  type ModelRoutingMetrics,
  type RoutingMetrics,
} from './ModelRegistry';

// Parallel Inference Engine
export {
  ParallelInferenceEngine,
  type InferenceJob,
  type InferenceResult,
  type InferenceError,
  type InferenceStats,
  type ParallelInferenceEngineConfig,
  type InferenceProvider,
  type InferenceProviderFactory,
} from './ParallelInferenceEngine';

// Worker Pool
export {
  ModelWorkerPool,
  type InferenceJob as WorkerInferenceJob,
  type InferenceResult as WorkerInferenceResult,
  type Worker,
  type WorkerStatus,
  type PoolConfig,
  type PoolMetrics,
  type PoolEvent,
} from './ModelWorkerPool';

// Unified Service
export {
  UnifiedAIService,
  getUnifiedAIService,
  resetUnifiedAIService,
  type ServiceJob,
  type ServiceJobType,
  type ServiceJobResult,
  type BatchJobRequest,
  type ServiceConfig,
  type ServiceHealth,
  type ServiceMetrics,
} from './UnifiedAIService';

// Alert Manager
export {
  AlertManager,
  getAlertManager,
  resetAlertManager,
  type Alert,
  type AlertType,
  type AlertSeverity,
  type AlertThresholds,
  type AlertConfig,
  type AlertListener,
} from './AlertManager';

// Queue
export { type QueueStats } from '@/infrastructure/queue/InferenceJobQueue';

// Default export
export { UnifiedAIService as default } from './UnifiedAIService';
