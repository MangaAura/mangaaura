'use client';

import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

import { Card } from '@/components/ui/Card';

interface ReportStatsProps {
  stats: {
    pending: number;
    underReview: number;
    highPriority: number;
    today: number;
  };
}

export function ReportStats({ stats }: ReportStatsProps) {
  const items = [
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning)]/20',
    },
    {
      label: 'En revisión',
      value: stats.underReview,
      icon: ShieldAlert,
color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info)]/20',
    },
    {
      label: 'Alta prioridad',
      value: stats.highPriority,
      icon: AlertTriangle,
color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error)]/20',
    },
    {
      label: 'Hoy',
      value: stats.today,
      icon: CheckCircle,
color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success)]/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{item.value}</p>
                <p className="text-sm text-[var(--text-secondary)]">{item.label}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
