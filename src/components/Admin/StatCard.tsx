'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon: Icon,
  trend = 'neutral',
  onClick,
  className = '',
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-[var(--success)]';
    if (trend === 'down') return 'text-[var(--error)]';
    return 'text-[var(--text-tertiary)]';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--text-muted)]">{title}</CardTitle>
<div className="p-2 bg-[var(--primary)]/20 rounded-lg">
      <Icon className="w-4 h-4 text-[var(--primary)]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
        {(description || change !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
            {changeLabel && (
              <span className="text-sm text-[var(--text-tertiary)]">{changeLabel}</span>
            )}
            {description && !change && (
              <p className="text-sm text-[var(--text-tertiary)]">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
