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
    if (trend === 'up') return 'text-emerald-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-500';
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
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {(description || change !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
            {changeLabel && (
              <span className="text-sm text-slate-500">{changeLabel}</span>
            )}
            {description && !change && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
