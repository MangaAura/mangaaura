/**
 * ErrorMessage Component
 *
 * Componente reutilizable para mostrar mensajes de error amigables y accionables.
 */

import { AlertCircle, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

interface ErrorMessageProps {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-[var(--error)]/10',
    borderColor: 'border-[var(--error)]/20',
    textColor: 'text-[var(--error)]',
    iconColor: 'text-[var(--error)]',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-[var(--warning)]/10',
    borderColor: 'border-[var(--warning)]/20',
    textColor: 'text-[var(--warning)]',
    iconColor: 'text-[var(--warning)]',
    title: 'Advertencia',
  },
  info: {
    icon: Info,
    bgColor: 'bg-[var(--primary)]/10',
    borderColor: 'border-[var(--primary)]/20',
    textColor: 'text-[var(--primary)]',
    iconColor: 'text-[var(--primary)]',
    title: 'Información',
  },
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-[var(--success)]/10',
    borderColor: 'border-[var(--success)]/20',
    textColor: 'text-[var(--success)]',
    iconColor: 'text-[var(--success)]',
    title: 'Éxito',
  },
};

export function ErrorMessage({
  title,
  message,
  severity = 'error',
  icon,
  action,
  onDismiss,
  className,
  children,
}: ErrorMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {icon || <Icon className={cn('h-5 w-5', config.iconColor)} />}
        </div>
        <div className="flex-1 min-w-0">
          {(title || config.title) && (
            <h2 className={cn('text-sm font-semibold mb-1', config.textColor)}>
              {title || config.title}
            </h2>
          )}
          <p className={cn('text-sm', config.textColor)}>{message}</p>
          {children && <div className="mt-2">{children}</div>}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-3 text-sm font-medium underline underline-offset-2 hover:no-underline',
                config.textColor
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg transition-colors',
              'hover:bg-[var(--surface)]',
              config.textColor
            )}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorBoundary Component
 *
 * Muestra un mensaje de error amigable cuando algo sale mal.
 */

interface ErrorBoundaryProps {
  error: Error | null;
  reset?: () => void;
  className?: string;
}

export function ErrorBoundary({ error, reset, className }: ErrorBoundaryProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'min-h-[400px] flex items-center justify-center p-6',
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-[var(--error)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          ¡Ups! Algo salió mal
        </h2>
        <p className="text-[var(--text-secondary)] mb-2">
          Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-[var(--text-tertiary)] font-mono bg-[var(--surface)] p-3 rounded-lg mb-6 overflow-auto max-h-32">
            {error.message}
          </p>
        )}
        {reset && (
          <button
            onClick={reset}
            className="px-6 py-3 bg-[var(--primary)] text-[var(--text-inverse)] rounded-xl font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 *
 * Muestra un estado vacío amigable cuando no hay datos.
 */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 bg-[var(--surface)] rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
