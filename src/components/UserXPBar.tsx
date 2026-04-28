'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { cn, getRankColor, getRankBgColor } from '@/lib/utils';

interface UserXPBarProps {
  compact?: boolean;
}

export function UserXPBar({ compact = false }: UserXPBarProps) {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { xpPoints = 0, level = 1 } = session.user;

  // Calcular progreso al siguiente nivel
  const currentLevelXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
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
          <div className="text-xs text-slate-500">{rank}</div>
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">Nivel {level}</h3>
          <p className={cn('text-sm', getRankColor(rank))}>{rank}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900">{xpPoints}</span>
          <span className="text-sm text-slate-500"> XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>{xpInLevel} / 1000 XP</span>
        <span>{1000 - xpInLevel} para nivel {level + 1}</span>
      </div>
    </div>
  );
}
