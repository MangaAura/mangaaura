'use client';

import { AlertTriangle, XCircle, AlertCircle, X, Info } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Alert, AlertSeverity } from '@/infrastructure/ai/AlertManager';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
  maxVisible?: number;
  className?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const alertConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertTriangle;
    colors: {
      bg: string;
      border: string;
      text: string;
      icon: string;
      button: string;
    };
    label: string;
  }
> = {
  critical: {
    icon: XCircle,
    colors: {
      bg: 'bg-[var(--error)]/10',
      border: 'border-[var(--error)]/50',
      text: 'text-[var(--error)]',
      icon: 'text-[var(--error)]',
      button: 'hover:bg-[var(--error)]/20 text-[var(--error)]',
    },
    label: 'Crítico',
  },
  warning: {
    icon: AlertTriangle,
    colors: {
      bg: 'bg-[var(--warning)]/10',
      border: 'border-[var(--warning)]/50',
      text: 'text-[var(--warning)]',
      icon: 'text-[var(--warning)]',
      button: 'hover:bg-[var(--warning)]/20 text-[var(--warning)]',
    },
    label: 'Advertencia',
  },
  info: {
    icon: Info,
    colors: {
      bg: 'bg-[var(--info)]/10',
      border: 'border-[var(--info)]/50',
      text: 'text-[var(--info)]',
      icon: 'text-[var(--info)]',
      button: 'hover:bg-[var(--info)]/20 text-[var(--info)]',
    },
    label: 'Info',
  },
};

// =============================================================================
// SINGLE ALERT ITEM
// =============================================================================

interface AlertItemProps {
  alert: Alert;
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
}

function AlertItem({ alert, onDismiss, onAcknowledge }: AlertItemProps) {
  const config = alertConfig[alert.severity];
  const Icon = config.icon;

  const handleDismiss = useCallback(() => {
    onDismiss?.(alert.id);
  }, [alert.id, onDismiss]);

  const handleAcknowledge = useCallback(() => {
    onAcknowledge?.(alert.id);
  }, [alert.id, onAcknowledge]);

  const formattedTime = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(alert.createdAt);

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
        config.colors.bg,
        config.colors.border,
        'animate-in slide-in-from-top-2 fade-in duration-300'
      )}
      role="alert"
      aria-live={alert.severity === 'critical' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={cn('w-5 h-5', config.colors.icon)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={cn('font-semibold text-sm', config.colors.text)}>
            {alert.title}
          </h4>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium border',
              config.colors.bg,
              config.colors.border,
              config.colors.text
            )}
          >
            {config.label}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">{formattedTime}</span>
        </div>

        <p className={cn('text-sm mt-1', config.colors.text)}>
          {alert.message}
        </p>

      {/* Metadata */}
      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {(alert.metadata as Record<string, string | number>).modelId && (
            <span className="text-xs px-2 py-1 rounded bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] border border-[var(--border)]">
              Modelo: {String((alert.metadata as Record<string, string | number>).modelId)}
            </span>
          )}
          {(alert.metadata as Record<string, string | number>).errorRate !== undefined && (
            <span className="text-xs px-2 py-1 rounded bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] border border-[var(--border)]">
              Error: {(Number((alert.metadata as Record<string, string | number>).errorRate) * 100).toFixed(1)}%
            </span>
          )}
          {(alert.metadata as Record<string, string | number>).queueDepth !== undefined && (
            <span className="text-xs px-2 py-1 rounded bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] border border-[var(--border)]">
              Cola: {String((alert.metadata as Record<string, string | number>).queueDepth)} jobs
            </span>
          )}
          {(alert.metadata as Record<string, string | number>).occurrenceCount !== undefined && (
            <span className="text-xs px-2 py-1 rounded bg-[var(--surface-sunken)]/50 text-[var(--text-secondary)] border border-[var(--border)]">
              Ocurrencias: {String((alert.metadata as Record<string, string | number>).occurrenceCount)}
            </span>
          )}
        </div>
      )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!alert.acknowledged && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAcknowledge}
              className={cn(
                'h-7 px-2 text-xs font-medium',
                config.colors.button
              )}
            >
              Reconocer
            </Button>
          )}
        </div>
      </div>

      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 h-7 w-7 -mt-1 -mr-1',
          config.colors.button
        )}
        aria-label="Cerrar alerta"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// COLLAPSED ALERTS SUMMARY
// =============================================================================

interface CollapsedAlertsProps {
  count: number;
  criticalCount: number;
  onExpand: () => void;
  className?: string;
}

function CollapsedAlerts({
  count,
  criticalCount,
  onExpand,
  className,
}: CollapsedAlertsProps) {
  return (
    <button
      onClick={onExpand}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 rounded-lg border backdrop-blur-sm',
        'bg-[var(--surface-sunken)]/50 border-[var(--border)] hover:bg-[var(--surface-sunken)]/70 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--error)] rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {count} alerta{count !== 1 ? 's' : ''} activa{count !== 1 ? 's' : ''}
        </span>
        {criticalCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]/30">
            {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <span className="text-xs text-[var(--text-secondary)]">Click para expandir</span>
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AlertBanner({
  alerts,
  onDismiss,
  onAcknowledge,
  maxVisible = 3,
  className,
}: AlertBannerProps) {
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const visibleAlerts = expanded ? alerts : alerts.slice(0, maxVisible);
  const hasMoreAlerts = alerts.length > maxVisible;

  if (!expanded) {
    return (
      <CollapsedAlerts
        count={alerts.length}
        criticalCount={criticalCount}
        onExpand={() => setExpanded(true)}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header with collapse option */}
      {alerts.length > maxVisible && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[var(--text-secondary)]">
            Mostrando {visibleAlerts.length} de {alerts.length} alertas
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="h-6 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Colapsar
          </Button>
        </div>
      )}

      {/* Alerts */}
      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
            onAcknowledge={onAcknowledge}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {hasMoreAlerts && expanded && (
        <div className="text-center py-1">
          <span className="text-xs text-[var(--text-tertiary)]">
            Y {alerts.length - maxVisible} alerta{alerts.length - maxVisible !== 1 ? 's' : ''} m{alerts.length - maxVisible !== 1 ? 'á' : 'á'}s
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT ALERT BADGE (for use in headers)
// =============================================================================

interface AlertBadgeProps {
  count: number;
  criticalCount?: number;
  onClick?: () => void;
  className?: string;
}

export function AlertBadge({
  count,
  criticalCount = 0,
  onClick,
  className,
}: AlertBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        criticalCount > 0
? 'bg-[var(--error)]/20 text-[var(--error)] border border-[var(--error)]/30 hover:bg-[var(--error)]/30'
        : 'bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning)]/30',
        className
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>{count}</span>
      {criticalCount > 0 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--error)] rounded-full animate-pulse" />
      )}
    </button>
  );
}

// =============================================================================
// ALERTS PANEL (Full panel for dashboard)
// =============================================================================

interface AlertsPanelProps extends AlertBannerProps {
  title?: string;
}

export function AlertsPanel({
  alerts,
  onDismiss,
  onAcknowledge,
  title = 'Alertas del Sistema',
  className,
}: AlertsPanelProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div
      className={cn(
        'bg-[var(--surface)]/50 border border-[var(--border)] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          {alerts.length > 0 && (
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--error)]/20 text-[var(--error)]">
                  {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--warning)]/20 text-[var(--warning)]">
                  {warningCount} advertencia{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        {alerts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alerts.forEach((a) => onDismiss?.(a.id))}
            className="h-7 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Descartar todo
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--surface-sunken)] mb-3">
              <CheckIcon className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">No hay alertas activas</p>
            <p className="text-[var(--text-tertiary)] text-xs mt-1">
              El sistema está funcionando correctamente
            </p>
          </div>
        ) : (
          <AlertBanner
            alerts={alerts}
            onDismiss={onDismiss}
            onAcknowledge={onAcknowledge}
            maxVisible={5}
          />
        )}
      </div>
    </div>
  );
}

// Check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AlertBanner;
