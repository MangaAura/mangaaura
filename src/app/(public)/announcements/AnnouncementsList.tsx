'use client';

import { AlertTriangle, Info, Megaphone, Wrench } from 'lucide-react';

interface AnnouncementWithCreator {
  id: string;
  message: string;
  messageEn: string | null;
  type: string;
  priority: string;
  style: string;
  isActive: boolean;
  startAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  creator: { username: string; displayName: string | null };
}

interface Props {
  announcements: AnnouncementWithCreator[];
}

const typeConfig: Record<string, { icon: typeof Info; bg: string; border: string }> = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  alert: { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
  maintenance: { icon: Wrench, bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
};

export function AnnouncementsList({ announcements }: Props) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-fg-secondary">
        <Megaphone className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg">No hay anuncios activos en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((a) => {
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <div key={a.id} className={`border rounded-xl p-5 ${config.bg} ${config.border}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium whitespace-pre-wrap">{a.message}</p>
                <p className="text-xs text-fg-secondary mt-2">
                  {a.creator.displayName || a.creator.username} &middot;{' '}
                  {new Date(a.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {a.expiresAt && (
                    <> &middot; Válido hasta {new Date(a.expiresAt).toLocaleDateString('es-ES')}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
