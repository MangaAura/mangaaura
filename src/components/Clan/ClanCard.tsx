'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';

interface ClanCardProps {
  clan: {
    id: string;
    name: string;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/community/clan/${clan.id}`}>
        <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200">
          {/* Header with emblem and ranking */}
          <div className="flex items-start gap-3 mb-3">
            {/* Clan Emblem */}
            <div className="relative">
              <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center overflow-hidden">
                {clan.emblemUrl ? (
                  <Image
                    src={clan.emblemUrl}
                    alt={clan.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    {clan.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Ranking Badge */}
              {rank && rank <= 3 && (
                <div
                  className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    rank === 1
                      ? 'bg-yellow-500 text-yellow-950'
                      : rank === 2
                        ? 'bg-gray-400 text-gray-950'
                        : 'bg-amber-600 text-amber-950'
                  }`}
                >
                  #{rank}
                </div>
              )}
            </div>

            {/* Clan Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                {clan.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {clan.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={14} className="text-[var(--accent-orange)]" />
                  {clan.monthlyScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {clan.description && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
              {clan.description}
            </p>
          )}

          {/* Score Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Puntaje total</span>
              <span className="font-medium flex items-center gap-1">
                <Trophy size={12} className="text-[var(--warning)]" />
                {clan.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] rounded-full transition-all group-hover:from-[var(--accent-purple)] group-hover:to-[var(--primary)]"
                style={{
                  width: `${Math.min((clan.totalScore / 10000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
