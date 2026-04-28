'use client';

import { motion } from 'framer-motion';
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
    rankingPosition?: number;
  };
  index?: number;
  rank?: number;
  isUserClan?: boolean;
}

export default function ClanCard({ clan, index = 0, rank, isUserClan }: ClanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/community/clans/${clan.id}`}>
        <div className="bg-surface rounded-xl p-4 border border-border hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/5">
          {/* Header with emblem and ranking */}
          <div className="flex items-start gap-3 mb-3">
            {/* Clan Emblem */}
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                {clan.emblemUrl ? (
                  <img
                    src={clan.emblemUrl}
                    alt={clan.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {clan.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Ranking Badge */}
              {clan.rankingPosition && clan.rankingPosition <= 3 && (
                <div
                  className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    clan.rankingPosition === 1
                      ? 'bg-yellow-500 text-yellow-950'
                      : clan.rankingPosition === 2
                        ? 'bg-gray-400 text-gray-950'
                        : 'bg-amber-600 text-amber-950'
                  }`}
                >
                  #{clan.rankingPosition}
                </div>
              )}
            </div>

            {/* Clan Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {clan.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {clan.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  {clan.monthlyScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {clan.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {clan.description}
            </p>
          )}

          {/* Score Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Puntaje total</span>
              <span className="font-medium flex items-center gap-1">
                <Trophy size={12} className="text-yellow-500" />
                {clan.totalScore.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all group-hover:from-secondary group-hover:to-primary"
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
