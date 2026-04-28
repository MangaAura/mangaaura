# Sistema de IA en Paralelo - Fase 5

Sistema unificado de inferencia paralela para Inkverse, diseñado para escalar el procesamiento de IA con múltiples modelos simultáneamente.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED AI SERVICE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Queue     │  │ Worker Pool │  │   Parallel Engine       │ │
│  │  Priority   │→ │  Execution  │→ │  Fallback & Retry       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         ↓                ↓                     ↓               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  MODEL REGISTRY                         │  │
│  │     NVIDIA │ Local │ OpenAI │ Anthropic | ...           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. InferenceJobQueue (`src/infrastructure/queue/InferenceJobQueue.ts`)
- **Heap de prioridad** para ordenar jobs (menor número = mayor prioridad)
- **Rate limiting** por tipo de job
- **Dead letter queue** para jobs fallidos
- **Persistencia opcional** en Redis
- Eventos: `job:added`, `job:started`, `job:completed`, `job:failed`

### 2. ModelWorkerPool (`src/infrastructure/ai/ModelWorkerPool.ts`)
- **Pool dinámico** de workers (min/max configurables)
- **Auto-scaling** basado en demanda
- **Health checks** periódicos
- **Reciclaje automático** tras maxJobsPerWorker

### 3. ParallelInferenceEngine (`src/infrastructure/ai/ParallelInferenceEngine.ts`)
- **Ejecución paralela** con control de concurrencia
- **Retry automático** con backoff exponencial
- **Sistema de fallbacks** a modelos alternativos
- **Timeouts** configurables por job

### 4. ModelRegistry (`src/infrastructure/ai/ModelRegistry.ts`)
- **Registro centralizado** de modelos
- **Health tracking** con degradación automática
- **Estrategias de routing**:
  - `round-robin`: Distribución equitativa
  - `least-latency`: Menor latencia primero
  - `capability-match`: Match específico
  - `fallback-chain`: Orden de preferencia
  - `weighted-random`: Aleatorio ponderado

### 5. UnifiedAIService (`src/infrastructure/ai/UnifiedAIService.ts`)
- **Orquestador principal** que integra todos los componentes
- **API simplificada** para el resto de la aplicación
- **Métricas y health checks** en tiempo real

## Uso Básico

```typescript
import { getUnifiedAIService } from '@/infrastructure/ai';

// Inicializar
const service = getUnifiedAIService();
await service.start();

// Analizar comentario
const result = await service.analyzeComment('¡Me encanta este capítulo!');

// Generar embedding
const embedding = await service.generateEmbedding('texto para embed');

// Clasificar género
const genres = await service.classifyGenre('dragons and magic');

// Procesar batch
const results = await service.submitBatch({
  jobs: [
    { type: 'classify-genre', payload: { prompt: 'action' } },
    { type: 'classify-genre', payload: { prompt: 'romance' } },
  ],
  strategy: 'parallel',
  failFast: false,
});
```

## React Hooks

```typescript
import { useAIService, useAIJob } from '@/hooks/useAIService';

// Hook completo
const { analyzeComment, isProcessing, queueDepth } = useAIService();

// Hook para job específico
const { data, isLoading, execute } = useAIJob('analyze-comment');

// Ejecutar
await execute({ content: 'comentario...' });
```

## API Endpoints

### POST /api/ai/submit
Envía un job individual al servicio de IA.

```json
{
  "type": "analyze-comment",
  "payload": { "content": "text...", "context": "optional" },
  "priority": 2,
  "modelId": "nvidia/llama-3.1-nemotron-70b",
  "timeout": 30000
}
```

### POST /api/ai/batch
Procesa múltiples jobs en paralelo.

```json
{
  "jobs": [
    { "type": "classify-genre", "payload": { "prompt": "action" } },
    { "type": "classify-genre", "payload": { "prompt": "romance" } }
  ],
  "strategy": "parallel",
  "failFast": false
}
```

### GET /api/ai/submit
Health check del servicio.

```json
{
  "status": "healthy",
  "components": { "queue": "up", "pool": "up", "engine": "up", "registry": "up" },
  "models": { "total": 2, "healthy": 2, "degraded": 0, "unhealthy": 0 }
}
```

## Configuración

```typescript
const service = getUnifiedAIService({
  // Queue
  maxRetries: 3,
  retryDelayMs: 5000,
  enablePersistence: false,
  
  // Worker Pool
  minWorkers: 2,
  maxWorkers: 10,
  maxJobsPerWorker: 100,
  idleTimeoutMs: 60000,
  
  // Engine
  maxConcurrent: 5,
  defaultTimeout: 30000,
  
  // Routing
  defaultStrategy: 'round-robin',
  
  // Providers
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  useInMemoryFallback: true,
});
```

## Prioridades de Jobs

| Prioridad | Uso |
|-----------|-----|
| 1 | Critical - Operaciones urgentes usuario |
| 2 | High - Requests importantes |
| 3 | Normal - Operaciones estándar (default) |
| 4 | Low - Tareas de fondo |
| 5 | Background - Procesamiento no-urgente |

## Métricas Disponibles

```typescript
// Health del servicio
const health = service.getHealth();

// Métricas detalladas
const metrics = service.getMetrics();

// Stats de la cola
const queueStats = service.getQueueStats();

// Métricas del pool
const poolMetrics = service.getPoolMetrics();
```

## Testing

```bash
# Tests de integración del sistema completo
npm test tests/integration/ai/UnifiedAIService.test.ts

# Tests del motor paralelo
npm test tests/integration/ai/ParallelInferenceEngine.test.ts
```

## Escalabilidad

El sistema está diseñado para escalar horizontalmente:

1. **Vertical**: Múltiples workers por instancia
2. **Horizontal**: Cada instancia puede procesar jobs independientemente
3. **Distribuido**: Redis como cola compartida entre instancias

Para escalar a múltiples servidores:

```typescript
const service = getUnifiedAIService({
  enablePersistence: true,
  redis: new Redis(process.env.REDIS_URL),
});
```

## Troubleshooting

### Jobs atascados
```typescript
// Cancelar job específico
service.cancelJob(jobId);

// Ver jobs en cola
const stats = service.getQueueStats();
console.log(stats.length); // Jobs pendientes
```

### Modelos degradados
```typescript
// Ver estado de modelos
const health = service.getHealth();
if (health.models.degraded > 0) {
  console.warn('Algunos modelos están degradados');
}
```

### Rate limiting
El sistema incluye rate limiting automático. Si ves errores 429:
- Aumenta `maxRequestsPerMinute` en la config del modelo
- Distribuye carga entre múltiples modelos
- Usa `submitBatch` para operaciones masivas
