'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Users,
  Timer,
  Hourglass,
  Clock,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

import { useCountdown } from '@/hooks/useCountdown';

export interface EventData {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  prize: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  color: string | null;
  borderColor: string | null;
  _count: {
    submissions: number;
  };
}

export function eventTypeLabel(type: string): string {
  switch (type) {
    case 'ART_CHALLENGE': return 'Desafío de Arte';
    case 'SPEEDREADING': return 'Lectura Rápida';
    case 'COMMUNITY': return 'Comunidad';
    default: return type;
  }
}

export function eventTypeIcon(type: string): string {
  switch (type) {
    case 'ART_CHALLENGE': return '🎨';
    case 'SPEEDREADING': return '⚡';
    case 'COMMUNITY': return '👥';
    default: return '📌';
  }
}

export function eventStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'ACTIVE': return { label: 'Activo', cls: 'bg-[var(--success)]/20 text-[#166534] dark:text-[#86efac]' };
    case 'VOTING': return { label: 'Votando', cls: 'bg-[var(--warning)]/20 text-[var(--warning)]' };
    case 'COMPLETED': return { label: 'Terminado', cls: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]' };
    default: return { label: status, cls: 'bg-[var(--surface-sunken)] text-[var(--text-muted)]' };
  }
}

export function EventCard({
  event,
  badge,
  index = 0,
}: {
  event: EventData;
  badge: { label: string; cls: string };
  index?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const countdown = useCountdown(event.endDate, event.startDate);
  const typeIcon = eventTypeIcon(event.type);

  const formatDateRange = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const fmt = (d: Date) =>
      d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${fmt(start)} → ${fmt(end)}`;
  };

  const countdownBadgeCls = countdown.isExpired
    ? 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
    : countdown.isCritical
      ? 'bg-[var(--error)]/20 text-[var(--error)]'
      : countdown.isEndingSoon
        ? 'bg-[var(--warning)]/20 text-[var(--warning)]'
        : 'bg-[var(--success)]/20 text-[#166534] dark:text-[#86efac]';

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.05,
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
      whileTap={shouldReduceMotion ? {} : { y: 0, transition: { duration: 0.1 } }}
    >
    <Link
      href={`/events?highlight=${event.id}`}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--warning)]/40 transition-all hover:shadow-md group block"
    >
      {/* Image section with countdown overlay */}
      <div className="relative h-36">
        {event.imageUrl ? (
          <div
            className="h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-[var(--warning)]/20 via-[var(--accent-purple)]/20 to-[var(--info)]/20 flex items-center justify-center">
            <span className="text-5xl">{typeIcon}</span>
          </div>
        )}
        {/* Countdown badge overlay */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${countdownBadgeCls}`}
          >
            {countdown.isExpired ? (
              <>
                <Hourglass size={12} />
                Finalizado
              </>
            ) : (
              <>
                <Timer size={12} />
                {countdown.formatted}
              </>
            )}
          </span>
        </div>
        {/* Type icon badge (bottom-left) */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-[var(--surface)]/80 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)]">
            {typeIcon} {eventTypeLabel(event.type)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Users size={10} />
            {event._count.submissions} participantes
          </span>
        </div>

        {/* Title */}
        <h2 className="font-bold text-base group-hover:text-[var(--warning)] transition-colors leading-tight">
          {event.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {event.description}
        </p>

        {/* Progress bar */}
        {!countdown.isExpired && event.startDate && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>Progreso</span>
              <span>{Math.round(countdown.progress)}%</span>
            </div>
            <div className="h-1 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--warning)] to-[var(--accent-orange)] rounded-full transition-all duration-1000"
                style={{ width: `${countdown.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: date range + prize */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]">
          <span className="flex items-center gap-1 text-[var(--text-muted)]">
            <Clock size={12} />
            {formatDateRange()}
          </span>
          <span className="font-semibold text-[var(--warning)] flex items-center gap-1">
            <Trophy size={12} />
            {event.prize}
          </span>
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
