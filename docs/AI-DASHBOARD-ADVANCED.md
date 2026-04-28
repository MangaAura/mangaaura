# AI Dashboard - Versión Avanzada

Dashboard completo con protección de autenticación, gráficos avanzados y sistema de alertas.

## 🔐 Autenticación

### Middleware de Protección

```typescript
// src/middleware.ts
const PROTECTED_PATHS = ['/admin'];

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Verificar autenticación
  if (!session?.user) {
    return NextResponse.redirect('/auth/login');
  }
  
  // Verificar rol de admin
  if (session.user.role !== 'ADMIN') {
    return NextResponse.redirect('/');
  }
}
```

### Server Component

```typescript
// src/app/admin/ai-dashboard/page.tsx
export default async function AIServiceDashboardPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    return <AccessDenied />;
  }
  
  return <AIServiceDashboardClient />;
}
```

## 📊 Gráficos con Recharts

### 1. MetricsLineChart

```tsx
import { MetricsLineChart } from '@/components/AI/charts';

<MetricsLineChart
  data={[
    { timestamp: '10:00', throughput: 45, latency: 120 },
    { timestamp: '10:05', throughput: 52, latency: 115 },
  ]}
  xKey="timestamp"
  yKey="throughput"
  color="#3b82f6"
  unit="jobs/min"
/>
```

### 2. ModelUsagePieChart

```tsx
import { ModelUsagePieChart } from '@/components/AI/charts';

<ModelUsagePieChart
  data={[
    { name: 'NVIDIA Nemotron', value: 450, color: '#3b82f6' },
    { name: 'In-Memory', value: 120, color: '#10b981' },
  ]}
/>
```

### 3. QueueAreaChart

```tsx
import { QueueAreaChart } from '@/components/AI/charts';

<QueueAreaChart
  data={[
    { time: '10:00', high: 5, medium: 12, low: 20 },
    { time: '10:05', high: 3, medium: 15, low: 18 },
  ]}
  showHigh={true}
  showMedium={true}
  showLow={true}
/>
```

## 🚨 Sistema de Alertas

### Tipos de Alertas

| Tipo | Severidad | Descripción |
|------|-----------|-------------|
| `model_degraded` | warning | Modelo con latencia alta |
| `model_unhealthy` | critical | Modelo no disponible |
| `high_error_rate` | warning | >5% de errores |
| `queue_backlog` | critical | >100 jobs en cola |

### Umbrales Configurables

```typescript
const alertConfig = {
  degradedThreshold: 2,      // Fallos consecutivos
  unhealthyThreshold: 5,     // Fallos consecutivos
  errorRateThreshold: 0.05,  // 5%
  queueBacklogThreshold: 100 // Jobs
};
```

### Uso del Hook

```tsx
import { useAIAlerts } from '@/hooks/useAIAlerts';

function MyComponent() {
  const { 
    alerts, 
    alertCount, 
    hasCriticalAlerts,
    dismissAlert, 
    acknowledgeAlert 
  } = useAIAlerts();
  
  return (
    <AlertsPanel 
      alerts={alerts}
      onDismiss={dismissAlert}
      onAcknowledge={acknowledgeAlert}
    />
  );
}
```

### Componentes de Alerta

```tsx
// Banner completo
<AlertBanner 
  alerts={alerts}
  maxVisible={3}
/>

// Badge compacto para headers
<AlertBadge 
  count={5} 
  criticalCount={1}
  onClick={() => setShowPanel(true)}
/>

// Panel completo
<AlertsPanel 
  alerts={alerts}
  title="Alertas del Sistema"
/>
```

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── admin/
│       └── ai-dashboard/
│           ├── page.tsx                    # Server Component
│           └── AIServiceDashboardClient.tsx  # Client Component
├── components/
│   └── AI/
│       ├── MetricCard.tsx
│       ├── ModelHealthCard.tsx
│       ├── QueueVisualizer.tsx
│       ├── AlertBanner.tsx
│       └── charts/
│           ├── MetricsLineChart.tsx
│           ├── ModelUsagePieChart.tsx
│           ├── QueueAreaChart.tsx
│           └── index.ts
├── hooks/
│   ├── useAIService.ts
│   └── useAIAlerts.ts
├── infrastructure/
│   └── ai/
│       ├── AlertManager.ts
│       ├── UnifiedAIService.ts
│       └── index.ts
└── middleware.ts
```

## 🎨 Características UI

### Tema Oscuro
- Background: `bg-slate-900`
- Cards: `bg-slate-800`, `border-slate-700`
- Text: `text-slate-100`, `text-slate-400`

### Animaciones
- Cards: `transition-all duration-300`
- Alertas: `animate-in slide-in-from-top-2`
- Gráficos: Transiciones suaves de Recharts

### Responsive
- Grid adaptativo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Charts con `ResponsiveContainer`
- Cards con espaciado consistente

## 🚀 Acceso

```
http://localhost:3000/admin/ai-dashboard
```

**Requisitos:**
1. Usuario autenticado
2. Rol: `ADMIN`

## 📈 Métricas en Tiempo Real

El dashboard actualiza automáticamente cada **2 segundos**:

```typescript
useEffect(() => {
  const interval = setInterval(fetchData, 2000);
  return () => clearInterval(interval);
}, [fetchData]);
```

## 🔔 Flujo de Alertas

1. **Detección**: `UnifiedAIService` detecta anomalías
2. **Emisión**: `AlertManager.emit()` notifica suscriptores
3. **Visualización**: `useAIAlerts` actualiza UI
4. **Acción**: Usuario puede reconocer o descartar

## 🔧 Personalización

### Cambiar Intervalo de Polling

```typescript
// src/app/admin/ai-dashboard/AIServiceDashboardClient.tsx
const POLLING_INTERVAL = 5000; // 5 segundos
```

### Agregar Nuevas Alertas

```typescript
// src/infrastructure/ai/AlertManager.ts
export type AlertType = 
  | 'model_degraded'
  | 'model_unhealthy' 
  | 'high_error_rate'
  | 'queue_backlog'
  | 'my_custom_alert'; // Nueva
```

### Personalizar Colores

```typescript
// src/components/AI/charts/MetricsLineChart.tsx
const colors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
};
```

## 🧪 Testing

```bash
# Tests de componentes
npm test -- src/components/AI/

# Tests de sistema de alertas
npm test -- src/infrastructure/ai/AlertManager.test.ts
```

## 📊 Métricas Disponibles

### Por Modelo
- Total requests
- Success rate
- Latencia promedio/máxima/mínima
- Estado de salud

### Por Sistema
- Jobs en cola (por prioridad)
- Throughput (jobs/min)
- Latencia promedio
- Error rate

### Por Componente
- Estado de Queue (up/down)
- Worker Pool (activos/ocupados)
- Inference Engine
- Model Registry
