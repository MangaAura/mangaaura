# AI Service Dashboard

Dashboard de monitoreo en tiempo real para el sistema de IA paralela.

## 📍 Ubicación

**URL**: `/admin/ai-dashboard`

## 🎨 Características

### Header
- Estado del servicio (Healthy/Degraded/Unhealthy)
- Timestamp de última actualización
- Indicador de polling automático

### Métricas Principales (Grid de 8 cards)

| Métrica | Descripción |
|---------|-------------|
| **Total Jobs** | Jobs procesados desde el inicio |
| **Completed Jobs** | Jobs completados exitosamente |
| **Failed Jobs** | Jobs que fallaron |
| **Queue Depth** | Jobs pendientes en cola |
| **Throughput** | Jobs por minuto |
| **Avg Latency** | Latencia promedio en ms |
| **Healthy Models** | Modelos disponibles |
| **Degraded/Unhealthy** | Modelos con problemas |

### Component Status
- ✅ Job Queue
- ✅ Worker Pool
- ✅ Inference Engine
- ✅ Model Registry

### Models Table
- Nombre del modelo
- Proveedor
- Estado (health badge)
- Requests exitosos/fallidos
- Tasa de éxito (%)
- Latencia promedio
- Capacidades

### Queue Statistics
- Pending / Processing / Completed
- Failed Jobs
- Average Wait Time
- Jobs by Priority (bar chart)
- Jobs by Type

## 🔄 Actualización en Tiempo Real

El dashboard se actualiza automáticamente cada **2 segundos** mediante polling.

```typescript
useEffect(() => {
  const interval = setInterval(fetchData, 2000);
  return () => clearInterval(interval);
}, [fetchData]);
```

## 🎨 Componentes UI

### MetricCard
```tsx
<MetricCard
  title="Completed Jobs"
  value={1234}
  trend="up"
  trendValue="12%"
  icon={<CheckCircle className="w-5 h-5" />}
  color="green"
/>
```

### ModelHealthCard
```tsx
<ModelHealthCard
  model={registeredModel}
  metrics={modelRoutingMetrics}
/>
```

### QueueVisualizer
```tsx
<QueueVisualizer
  stats={queueStats}
  maxBars={20}
/>
```

## 📊 Colores de Prioridad

| Prioridad | Color | Descripción |
|-----------|-------|-------------|
| 1 (Critical) | 🔴 Rojo | Operaciones urgentes |
| 2 (High) | 🟠 Naranja | Requests importantes |
| 3 (Normal) | 🔵 Azul | Operaciones estándar |
| 4 (Low) | 🟣 Púrpura | Tareas de fondo |
| 5 (Background) | ⚪ Gris | Procesamiento no-urgente |

## 🚀 Uso

### 1. Navegar al Dashboard
```
http://localhost:3000/admin/ai-dashboard
```

### 2. Interpretar Estados

#### Status Badge
- 🟢 **Healthy**: Todos los componentes funcionando
- 🟡 **Degraded**: Algunos modelos con problemas
- 🔴 **Unhealthy**: Servicio no disponible

#### Model Health
- 🟢 **Healthy**: Funcionando correctamente
- 🟡 **Degraded**: Latencia alta o errores intermitentes
- 🔴 **Unhealthy**: No disponible
- ⚪ **Unknown**: Sin health check reciente

### 3. Acciones

Si ves modelos **Degraded** o **Unhealthy**:
1. Revisa los logs del servicio
2. Verifica conectividad con APIs externas (NVIDIA)
3. Considera usar modelos de fallback
4. Revisa rate limits

## 🔧 Configuración

### Cambiar intervalo de polling

```typescript
// src/app/admin/ai-dashboard/page.tsx
const POLLING_INTERVAL = 2000; // Cambiar a 5000 para 5 segundos
```

### Personalizar colores

```typescript
// src/components/AI/MetricCard.tsx
const colorClasses = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  green: { bg: "bg-green-500/20", text: "text-green-400" },
  // ...
};
```

## 📈 Métricas Avanzadas

Para acceso programático a las métricas:

```typescript
import { useAIService } from '@/hooks/useAIService';

function MyComponent() {
  const { getHealth, getMetrics, getQueueStats } = useAIService();
  
  const health = getHealth();
  const metrics = getMetrics();
  const queueStats = getQueueStats();
  
  return <div>Queue: {queueStats.length} jobs</div>;
}
```

## 🎯 Casos de Uso

### Monitoreo Operacional
1. Verificar que todos los modelos estén healthy
2. Revisar queue depth (debe ser < 100)
3. Monitorear throughput y latencia

### Debugging
1. Identificar modelos con alta tasa de errores
2. Revisar jobs fallidos
3. Analizar distribución por prioridad

### Optimización
1. Identificar cuellos de botella
2. Ajustar número de workers
3. Revisar estrategia de routing

## 🔐 Seguridad

El dashboard está en `/admin/` - asegúrate de protegerlo:

```typescript
// middleware.ts
export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(request: NextRequest) {
  // Verificar autenticación y roles
}
```

## 📝 Changelog

### v1.0.0
- ✅ Dashboard inicial
- ✅ Métricas en tiempo real
- ✅ Visualización de cola
- ✅ Estado de modelos
- ✅ Component status
