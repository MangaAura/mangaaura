/**
 * StatCard Component
 * 
 * Card de estadísticas para dashboards.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      className={cn(
        'relative rounded-xl p-6 border transition-all duration-300',
        variant === 'highlight'
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30'
          : 'bg-slate-800/50 border-slate-700',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
          {icon}
        </div>
      )}

      {/* Content */}
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}

        {/* Trend */}
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-1 mt-2', trendColors[trend])}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
