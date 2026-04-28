# ADR 003: Rate Limiting para NVIDIA API

## Estado
Aceptado

## Contexto
- **Límite**: 40 requests/minuto (RPM) de NVIDIA
- **Uso**: Análisis de comentarios, resúmenes, embeddings, búsqueda semántica
- **Riesgo**: Exceder el límite = downtime de funcionalidades IA

## Decisión
Implementar rate limiting con **Bottleneck** + caché agresiva.

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Request   │────▶│  Bottleneck  │────▶│   NVIDIA    │
│   (Coment)  │     │  (40 RPM)    │     │   API       │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Cache     │ (TTL: 1h)
                    │  (Redis)     │
                    └──────────────┘
```

## Implementación

```typescript
const limiter = new Bottleneck({
  reservoir: 40,        // 40 requests
  reservoirRefreshAmount: 40,
  reservoirRefreshInterval: 60 * 1000, // 1 minuto
  maxConcurrent: 1,
  minTime: 1500,      // 1.5s entre requests
});
```

## Estrategia de Caché

| Función | Clave | TTL |
|---------|-------|-----|
| analyzeComment | `analyze:${hash(content)}` | 1 hora |
| generateEmbedding | `emb:${hash(text)}` | 1 hora |
| summarizeChapter | `summary:${chapterId}` | 24 horas |

## Fallbacks

### Si rate limit excedido:
1. **Cola**: Requests van a cola automáticamente
2. **Retry**: Reintentar con backoff exponencial
3. **Fallback**: Usar `InMemoryAIProvider` (heurísticas locales)

```typescript
// Fallback para analyzeComment
private fallbackCommentAnalysis(content: string): CommentAnalysis {
  const lower = content.toLowerCase();
  const spoilerWords = ['muere', 'muerte', 'secreto', 'final'];
  let spoilerScore = 0;
  
  for (const word of spoilerWords) {
    if (lower.includes(word)) spoilerScore += 15;
  }
  
  return {
    spoilerScore: Math.min(100, spoilerScore),
    sentiment: detectSentiment(lower),
    toxicity: detectToxicity(lower),
    categories: [],
  };
}
```

## Prioridad de Requests

```
ALTA (reservar 10 RPM):
├── Anti-spoiler (bloquea comentarios)
└── Moderación urgente

MEDIA (reservar 15 RPM):
├── Resúmenes de capítulos
└── Notificaciones inteligentes

BAJA (reservar 15 RPM):
├── Búsqueda semántica
└── Análisis de calidad
```

## Monitoreo

```typescript
getRateLimitStats(): {
  reservoir: number;  // Requests restantes
  queued: number;     // En cola
  running: number;    // Ejecutándose
}
```

## Consecuencias

### Positivas
- ✅ No excedemos límites de NVIDIA
- ✅ Cola automática de requests
- ✅ Caché reduce costos y latencia
- ✅ Fallbacks para alta disponibilidad

### Negativas
- ❌ Latencia si hay muchos requests
- ❌ Complejidad adicional
- ❌ Caché puede ser stale

## Alternativas

### 1. Múltiples cuentas NVIDIA
- ⚠️ Complejo de gestionar
- ⚠️ Podría violar ToS

### 2. Modelos locales (Ollama)
- ✅ Sin límites
- ❌ Requiere GPU potente
- ❌ Más infraestructura

### 3. Azure OpenAI
- ✅ Más capacidad
- ❌ Costo más alto
- ❌ Vendor lock-in

## Implementación

Ver: `src/infrastructure/ai/NVIDIAProvider.ts`

## Testing

```typescript
// InMemoryAIProvider para tests sin NVIDIA
const aiProvider = process.env.NODE_ENV === 'test'
  ? new InMemoryAIProvider()
  : new NVIDIAProvider();
```

## Fecha
2024-01-20
