'use client';

import { motion } from 'framer-motion';
import { Users, Trophy, Flame, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ClanCardProps {
  clan: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    emblemUrl?: string | null;
    totalScore: number;
    monthlyScore: number;
    memberCount: number;
  };
  index?: number;
  rank?: number;
}

export default function ClanCard({ clan, index = 0, rank }: ClanCardProps) {
  const isTop3 = rank !== undefined && rank >= 1 && rank <= 3;
  const rankColors = [
    { ring: 'ring-amber-400/40', border: 'border-amber-400/30', text: 'text-amber-300', bg: 'bg-amber-400/15', label: 'Oro' },
    { ring: 'ring-slate-300/40', border: 'border-slate-300/30', text: 'text-slate-300', bg: 'bg-slate-300/15', label: 'Plata' },
    { ring: 'ring-amber-600/40', border: 'border-amber-600/30', text: 'text-amber-600', bg: 'bg-amber-600/15', label: 'Bronce' },
  ];
  const rs = isTop3 ? rankColors[rank! - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <Link href={`/community/clan/${clan.slug}`} className="block group">
        <div
          className={`
            relative overflow-hidden rounded-2xl border
            bg-[var(--surface)]/80 backdrop-blur-sm
            ${isTop3 ? rs!.border : 'border-[var(--border)]'}
            hover:border-[var(--primary)]/40
            hover:shadow-xl hover:shadow-[var(--primary)]/8
            hover:-translate-y-1 active:translate-y-0
            transition-all duration-300
          `}
        >
          {/* Top gradient accent bar */}
          <div
            className={`
              absolute inset-x-0 top-0 h-1 bg-gradient-to-r
              ${isTop3
                ? 'from-[var(--primary)]/60 via-transparent to-transparent'
                : 'from-transparent via-transparent to-transparent group-hover:from-[var(--primary)]/40 group-hover:via-[var(--accent-purple)]/30 group-hover:to-transparent'
              }
              transition-all duration-500
            `}
          />

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-start gap-4">
              {/* Emblem - circular profile pic style */}
              <div className="relative flex-shrink-0">
                {clan.emblemUrl ? (
                  <div className={`relative w-16 h-16 rounded-full overflow-hidden ${isTop3 ? `ring-2 ${rs!.ring}` : 'ring-1 ring-[var(--border)]'} transition-shadow duration-300 group-hover:ring-2 group-hover:ring-[var(--primary)]/40`}>
                    <Image
                      src={clan.emblemUrl}
                      alt={clan.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center ${isTop3 ? `ring-2 ${rs!.ring}` : 'ring-1 ring-[var(--border)]'} transition-shadow duration-300 group-hover:ring-2 group-hover:ring-[var(--primary)]/40 group-hover:from-[var(--primary)]/30 group-hover:to-[var(--accent-purple)]/30`}>
                    <span className="text-2xl font-bold text-[var(--primary)]">
                      {clan.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Rank badge */}
                {isTop3 && (
                  <div
                    className={`absolute -top-1 -right-1 w-7 h-7 rounded-full ${rs!.bg} border-2 border-[var(--surface)] flex items-center justify-center shadow-lg`}
                    aria-label={`Ranking #${rank}, ${rs!.label}`}
                  >
                    <span className={`text-[11px] font-black ${rs!.text}`}>#{rank}</span>
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {clan.name}
                  </h3>
                  {isTop3 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${rs!.text} ${rs!.bg}`}>
                      {rs!.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <Users size={14} className="text-[var(--text-tertiary)]" aria-hidden="true" />
                    <span className="font-medium">{clan.memberCount}</span>
                    <span className="text-[var(--text-tertiary)] hidden sm:inline">miembros</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] opacity-40" />
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <Flame size={14} className="text-[var(--accent-orange)]" aria-hidden="true" />
                    <span className="font-medium">{clan.monthlyScore.toLocaleString()}</span>
                    <span className="text-[var(--text-tertiary)] hidden sm:inline">este mes</span>
                  </span>
                </div>
              </div>

              {/* Chevron on hover */}
              <div className="flex-shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ChevronRight size={20} className="text-[var(--text-tertiary)]" />
              </div>
            </div>

            {/* Description */}
            {clan.description && (
              <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {clan.description}
              </p>
            )}

            {/* Score bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-tertiary)] font-medium flex items-center gap-1.5">
                  <Trophy size={12} className="text-[var(--warning)]" aria-hidden="true" />
                  Puntaje total
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {clan.totalScore.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((clan.totalScore / 10000) * 100, 100)}%` }}
                  transition={{ delay: 0.2 + index * 0.06, duration: 0.8, ease: 'easeOut' }}
                  className={`
                    h-full rounded-full
                    bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]
                    group-hover:from-[var(--accent-purple)] group-hover:to-[var(--primary)]
                    transition-all duration-500
                    ${isTop3 ? 'shadow-sm shadow-[var(--primary)]/40' : ''}
                  `}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
