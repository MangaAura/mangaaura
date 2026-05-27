'use client';

import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import useSWR from 'swr';

import { fetcher } from '@/lib/swr-config';

interface Announcement {
  id: string; message: string; messageEn?: string; type: string;
  priority: string; style: string; startAt: string; expiresAt?: string;
}

const TYPE_CLASSES: Record<string, { bg: string; border: string; icon: React.ElementType; color: string }> = {
  info:    { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: Info, color: 'text-blue-600 dark:text-blue-400' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
  error:   { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertCircle, color: 'text-red-600 dark:text-red-400' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
};

export function AnnouncementsBanner() {
  const { data } = useSWR<{ announcements: Announcement[] }>('/api/announcements', fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
  });

  if (!data?.announcements?.length) return null;

  return (
    <div className="w-full">
      {data!.announcements.map((a) => {
        const c = TYPE_CLASSES[a.type] || TYPE_CLASSES.info;
        const Icon = c.icon;

        return (
          <div
            key={a.id}
            className={`flex items-center gap-3 px-4 py-2.5 ${c.bg} border-b ${c.border}`}
          >
            <Icon className={`w-4 h-4 ${c.color} shrink-0`} />
            <p className="text-sm text-[var(--text-primary)] flex-1">{a.message}</p>
          </div>
        );
      })}
    </div>
  );
}