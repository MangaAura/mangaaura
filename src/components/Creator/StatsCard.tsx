'use client';

import { LucideIcon } from 'lucide-react';

import { cn , formatNumber } from '@/lib/utils';


interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  variant?: 'default' | 'indigo' | 'purple' | 'green' | 'amber';
}

const variantStyles = {
  default: 'bg-[var(--surface-elevated)] border-[var(--border)]',
  indigo: 'bg-[var(--primary)]/10 border-[var(--primary)]/30',
  purple: 'bg-[var(--accent-purple)]/10 border-[var(--accent-purple)]/30',
  green: 'bg-[var(--success)]/10 border-[var(--success)]/30',
  amber: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
};

const iconStyles = {
  default: 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
  indigo: 'bg-[var(--primary)]/20 text-[var(--primary)]',
  purple: 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]',
  green: 'bg-[var(--success)]/10 text-[var(--success)]',
  amber: 'bg-[var(--warning)]/10 text-[var(--warning)]',
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  variant = 'default',
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6 shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
<p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">
            {formatNumber(value)}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                )}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-[var(--text-tertiary)]">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            iconStyles[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
