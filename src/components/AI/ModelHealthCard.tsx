'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import {
  RegisteredModel,
  ModelRoutingMetrics,
} from '@/infrastructure/ai';
import { cn } from '@/lib/utils';

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
      gradient: 'from-[var(--success)]/5 via-[var(--surface)] to-[var(--surface)]',
      borderColor: 'border-[var(--success)]/30',
      progressColor: 'bg-[var(--success)]',
      textColor: 'text-[var(--success)]',
      label: 'Saludable',
    },
    degraded: {
      icon: AlertTriangle,
      badgeVariant: 'warning' as const,
      gradient: 'from-[var(--warning)]/5 via-[var(--surface)] to-[var(--surface)]',
      borderColor: 'border-[var(--warning)]/30',
      progressColor: 'bg-[var(--warning)]',
      textColor: 'text-[var(--warning)]',
      label: 'Degradado',
    },
    unhealthy: {
      icon: XCircle,
      badgeVariant: 'destructive' as const,
      gradient: 'from-[var(--error)]/5 via-[var(--surface)] to-[var(--surface)]',
      borderColor: 'border-[var(--error)]/30',
      progressColor: 'bg-[var(--error)]',
      textColor: 'text-[var(--error)]',
      label: 'No saludable',
    },
    unknown: {
      icon: AlertTriangle,
      badgeVariant: 'secondary' as const,
      gradient: 'from-[var(--surface-sunken)]/50 via-[var(--surface)] to-[var(--surface)]',
      borderColor: 'border-[var(--border)]',
      progressColor: 'bg-[var(--text-tertiary)]',
      textColor: 'text-[var(--text-tertiary)]',
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
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {model.name}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {model.provider}
          </Badge>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">{model.id}</p>
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
            <span className="text-[var(--text-secondary)]">Tasa de éxito</span>
            <span className={cn('font-medium', config.textColor)}>
              {successRatePercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--surface-sunken)] overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.progressColor)}
              style={{ width: `${successRatePercentage}%` }}
            />
          </div>
        </div>

        {/* Métricas de requests */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
        <p className="text-xs text-[var(--text-tertiary)]">Requests</p>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          <span className="text-[var(--success)]">{metrics.successfulRequests}</span>
          <span className="text-[var(--text-muted)] mx-1">/</span>
              <span>{metrics.totalRequests}</span>
            </p>
          </div>
          <div className="space-y-1">
        <p className="text-xs text-[var(--text-tertiary)]">Latencia promedio</p>
        <p className="text-sm font-medium text-[var(--text-primary)]">
              {Math.round(metrics.averageLatencyMs)}ms
            </p>
          </div>
        </div>

        {/* Capacidades */}
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-tertiary)]">Capacidades</p>
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
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-tertiary)]">Último check</p>
        <p className="text-xs font-medium text-[var(--text-secondary)]">
            {formatRelativeTime(model.status.lastHealthCheck)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModelHealthCard;
