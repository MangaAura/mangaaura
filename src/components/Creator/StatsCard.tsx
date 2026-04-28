'use client';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
  default: 'bg-white border-slate-200',
  indigo: 'bg-indigo-50 border-indigo-200',
  purple: 'bg-purple-50 border-purple-200',
  green: 'bg-green-50 border-green-200',
  amber: 'bg-amber-50 border-amber-200',
};

const iconStyles = {
  default: 'bg-slate-100 text-slate-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
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
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {formatNumber(value)}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-400">{trendLabel}</span>
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
