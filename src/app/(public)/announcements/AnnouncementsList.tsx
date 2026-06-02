'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Info, Megaphone, Wrench, Calendar } from 'lucide-react';

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

const typeConfig: Record<string, {
  icon: typeof Info;
  label: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
  dot: string;
}> = {
  info: {
    icon: Info,
    label: 'Información',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    dot: 'bg-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Advertencia',
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    dot: 'bg-amber-500',
  },
  alert: {
    icon: AlertTriangle,
    label: 'Alerta',
    gradient: 'from-red-500/10 to-rose-500/5',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-500',
    border: 'border-red-500/20 hover:border-red-500/40',
    dot: 'bg-red-500',
  },
  maintenance: {
    icon: Wrench,
    label: 'Mantenimiento',
    gradient: 'from-purple-500/10 to-violet-500/5',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-500',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    dot: 'bg-purple-500',
  },
};

export function AnnouncementsList({ announcements }: Props) {
  if (announcements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-lg font-medium text-[var(--text-secondary)] mb-1">
          No hay anuncios activos
        </p>
        <p className="text-sm text-[var(--text-tertiary)]">
          Los nuevos anuncios aparecerán aquí automáticamente.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((a, idx) => {
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.06, duration: 0.4, ease: 'easeOut' }}
          >              <div
                className={`
                  group relative overflow-hidden rounded-xl border bg-[var(--surface-elevated)] p-5
                  transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
                  ${config.border}
                `}
              >
              {/* Gradient overlay on hover */}
              <div
                className={`
                  absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500
                  bg-gradient-to-br ${config.gradient}
                `}
              />

              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${config.dot}`} />

              <div className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                    p-2.5 rounded-xl shrink-0 shadow-sm
                    transition-transform duration-300 group-hover:scale-110
                    ${config.iconBg}
                  `}
                >
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2
                      ${config.iconBg} ${config.iconColor}
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>

                  {/* Message */}
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {a.message}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="w-px h-3 bg-[var(--border)]" />
                    <span>
                      {a.creator.displayName || a.creator.username}
                    </span>
                    {a.expiresAt && (
                      <>
                        <span className="w-px h-3 bg-[var(--border)]" />
                        <span>
                          Válido hasta {new Date(a.expiresAt).toLocaleDateString('es-ES')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
