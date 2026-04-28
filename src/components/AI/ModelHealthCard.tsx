'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  RegisteredModel,
  ModelRoutingMetrics,
} from '@/infrastructure/ai';

interface ModelHealthCardProps {
  model: RegisteredModel;
  metrics: ModelRoutingMetrics;
  className?: string;
}

/**
 * Función auxiliar para formatear el tiempo relativo
 */
function formatRelativeTime(date: Date | undefined): string {
  if (!date) return 'Nunca';

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

/**
 * Componente para mostrar el estado de salud de un modelo
 */
export function ModelHealthCard({
  model,
  metrics,
  className,
}: ModelHealthCardProps) {
  const { health } = model.status;

  // Configuración de estilos según el estado de salud
  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      badgeVariant: 'success' as const,
      gradient: 'from-emerald-50/50 via-white to-white',
      borderColor: 'border-emerald-200',
      progressColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      label: 'Saludable',
    },
    degraded: {
      icon: AlertTriangle,
      badgeVariant: 'warning' as const,
      gradient: 'from-amber-50/50 via-white to-white',
      borderColor: 'border-amber-200',
      progressColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      label: 'Degradado',
    },
    unhealthy: {
      icon: XCircle,
      badgeVariant: 'destructive' as const,
      gradient: 'from-red-50/50 via-white to-white',
      borderColor: 'border-red-200',
      progressColor: 'bg-red-500',
      textColor: 'text-red-700',
      label: 'No saludable',
    },
    unknown: {
      icon: AlertTriangle,
      badgeVariant: 'secondary' as const,
      gradient: 'from-slate-50/50 via-white to-white',
      borderColor: 'border-slate-200',
      progressColor: 'bg-slate-500',
      textColor: 'text-slate-700',
      label: 'Desconocido',
    },
  };

  const config = statusConfig[health];
  const StatusIcon = config.icon;

  // Calcular porcentaje de éxito
  const successRatePercentage = Math.round(metrics.successRate * 100);

  // Mapear capabilities a etiquetas legibles
  const capabilityLabels: Record<string, string> = {
    chat: 'Chat',
    embedding: 'Embeddings',
    classification: 'Clasificación',
    summarization: 'Resumen',
    'image-generation': 'Imágenes',
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border bg-gradient-to-br transition-all duration-200',
        config.gradient,
        config.borderColor,
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">
                {model.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {model.provider}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">{model.id}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <StatusIcon className={cn('w-5 h-5', config.textColor)} />
            <Badge variant={config.badgeVariant} className="text-xs">
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de tasa de éxito */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Tasa de éxito</span>
            <span className={cn('font-medium', config.textColor)}>
              {successRatePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.progressColor)}
              style={{ width: `${successRatePercentage}%` }}
            />
          </div>
        </div>

        {/* Métricas de requests */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Requests</p>
            <p className="text-sm font-medium text-slate-900">
              <span className="text-emerald-600">{metrics.successfulRequests}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span>{metrics.totalRequests}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Latencia promedio</p>
            <p className="text-sm font-medium text-slate-900">
              {Math.round(metrics.averageLatencyMs)}ms
            </p>
          </div>
        </div>

        {/* Capacidades */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Capacidades</p>
          <div className="flex flex-wrap gap-1.5">
            {model.capabilities.map((capability) => (
              <Badge
                key={capability}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                {capabilityLabels[capability] || capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Último health check */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">Último check</p>
          <p className="text-xs font-medium text-slate-700">
            {formatRelativeTime(model.status.lastHealthCheck)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModelHealthCard;
