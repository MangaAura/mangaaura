'use client';

import { Flame, Snowflake } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { cn, getRankColor, getRankBgColor } from '@/lib/utils';


interface StreakData {
  streak: number;
  alreadyReadToday: boolean;
  freezesAvailable: number;
  bonusMultiplier: number;
  nextMilestone: number;
  daysToNextMilestone: number;
}

interface UserXPBarProps {
  compact?: boolean;
  /** Optional pre-fetched streak data (to avoid extra fetch) */
  streakData?: StreakData | null;
}

async function fetchStreak(): Promise<StreakData | null> {
  try {
    const res = await fetch('/api/gamification/streak');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function UserXPBar({ compact = false, streakData }: UserXPBarProps) {
  const { data: session } = useSession();
  const { data: remoteStreak } = useSWR(
    session?.user?.id && !streakData ? '/api/gamification/streak' : null,
    fetchStreak,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      fallbackData: streakData,
    },
  );

  if (!session?.user) return null;

  const { xpPoints = 0, level = 1 } = session.user;
  const streak = streakData ?? remoteStreak;

  // Calcular progreso al siguiente nivel
  const currentLevelXP = (level - 1) * 1000;
  const xpInLevel = xpPoints - currentLevelXP;
  const progress = Math.round((xpInLevel / 1000) * 100);

  // Determinar rango por nivel
  const getRank = (lvl: number) => {
    if (lvl < 2) return 'Novato';
    if (lvl < 4) return 'Lector Shonen';
    if (lvl < 7) return 'Otaku Experto';
    if (lvl < 10) return 'Maestro Otaku';
    return 'Leyenda Manga';
  };

  const rank = getRank(level);

  if (compact) {
    return (
      <Link href="/profile" className="flex items-center gap-2 group">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold', getRankBgColor(rank))}>
          {level}
        </div>
        <div className="hidden md:block">
          <div className="text-xs text-[var(--text-secondary)]">{rank}</div>
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-1.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {streak && (
              <span className={cn(
                'text-[10px] flex items-center gap-0.5 font-medium',
                streak.alreadyReadToday
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--text-tertiary)]',
              )}>
                <Flame className="w-3 h-3" />
                {streak.streak}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-4 shadow-sm border border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Nivel {level}</h3>
          <p className={cn('text-sm', getRankColor(rank))}>{rank}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{xpPoints}</span>
          <span className="text-sm text-[var(--text-secondary)]"> XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] via-[var(--accent-purple)] to-[var(--accent-red)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)]">
        <span>{xpInLevel} / 1000 XP</span>
        <span>{1000 - xpInLevel} para nivel {level + 1}</span>
      </div>

      {/* Streak section */}
      {streak && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            {/* Streak count */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  streak.alreadyReadToday
                    ? 'bg-[var(--accent-green)]/20'
                    : 'bg-[var(--surface-sunken)]',
                )}
              >
                <Flame
                  className={cn(
                    'w-4 h-4',
                    streak.alreadyReadToday
                      ? 'text-[var(--accent-green)]'
                      : 'text-[var(--text-tertiary)]',
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {streak.streak} {streak.streak === 1 ? 'día' : 'días'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {streak.alreadyReadToday
                    ? '✓ Racha activa hoy'
                    : streak.nextMilestone > 0
                      ? `${streak.daysToNextMilestone} días para el hito de ${streak.nextMilestone}d`
                      : '— ¡Lee para mantenerla!'}
                </p>
              </div>
            </div>

            {/* Bonus multiplier & freezes */}
            <div className="flex items-center gap-3">
              {streak.bonusMultiplier > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium">
                  +{streak.bonusMultiplier} XP bonus
                </span>
              )}
              {streak.freezesAvailable > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--info)]">
                  <Snowflake className="w-3 h-3" />
                  {streak.freezesAvailable}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
