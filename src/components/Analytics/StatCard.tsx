/**
 * StatCard Component
 *
 * Tarjeta individual de estadísticas con valor, trend y comparación.
 */

'use client';

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatCardProps {
  /** Título de la estadística */
  title: string;
  /** Valor principal */
  value: string | number;
  /** Cambio porcentual vs período anterior */
  trend?: number;
  /** Texto descriptivo del período de comparación */
  trendLabel?: string;
  /** Icono opcional (componente Lucide) */
  icon?: LucideIcon;
  /** Variante visual */
  variant?: 'default' | 'highlight';
  /** Clases adicionales */
  className?: string;
  /** Formato del valor */
  format?: 'number' | 'percentage' | 'time' | 'currency';
}

const variantStyles = {
  default: {
    card: 'bg-[var(--surface-elevated)] border-[var(--border)]',
    iconBg: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
    value: 'text-[var(--text-primary)]',
  },
  highlight: {
    card: 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] border-transparent',
    iconBg: 'bg-[var(--text-inverse)]/20 text-[var(--text-inverse)]',
    value: 'text-[var(--text-inverse)]',
  },
};

function formatValue(value: string | number, format: StatCardProps['format']): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'number':
      return value.toLocaleString('es');
    case 'percentage':
      return `${value}%`;
    case 'time':
      if (value < 60) return `${value}s`;
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    case 'currency':
      return `${value.toLocaleString('es')} IC`;
    default:
      return value.toLocaleString('es');
  }
}

export function StatCard({
  title,
  value,
  trend,
  trendLabel = 'vs período anterior',
  icon: Icon,
  variant = 'default',
  className,
  format = 'number',
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
      'rounded-xl border p-6 shadow-sm transition-all duration-200',
      'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              variant === 'highlight' ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-3xl font-bold mt-2 tracking-tight',
              styles.value
            )}
          >
            {formatValue(value, format)}
          </p>

          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-sm font-semibold px-2 py-0.5 rounded-full',
                  variant === 'highlight'
                    ? isPositive
                      ? 'bg-[var(--text-inverse)]/20 text-[var(--text-inverse)]'
                      : 'bg-[var(--error)]/20 text-[var(--error)]'
                    : isPositive
? 'bg-[var(--success)]/10 text-[var(--success)]'
            : 'bg-[var(--error)]/10 text-[var(--error)]'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {isPositive ? '+' : ''}{trend}%
              </span>
              <span
                className={cn(
                  'text-xs',
                  variant === 'highlight' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
                )}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'p-3 rounded-xl flex-shrink-0 ml-4',
              styles.iconBg
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
