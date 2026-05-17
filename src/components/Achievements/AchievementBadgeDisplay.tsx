'use client';

import { cn } from '@/lib/utils';
import { Lock, Sparkles } from 'lucide-react';
import type { Difficulty } from '@/hooks/useAchievements';

interface AchievementBadgeDisplayProps {
  badgeId: string;
  name: string;
  rarity: Difficulty;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const rarityGlow: Record<Difficulty, string> = {
  EASY: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
  MEDIUM: 'shadow-[0_0_16px_rgba(59,130,246,0.4)]',
  HARD: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
  LEGENDARY: 'shadow-[0_0_28px_rgba(245,158,11,0.6)] animate-pulse',
};

const rarityRing: Record<Difficulty, string> = {
  EASY: 'from-[#22c55e] to-[#16a34a]',
  MEDIUM: 'from-[#3b82f6] to-[#2563eb]',
  HARD: 'from-[#8b5cf6] to-[#7c3aed]',
  LEGENDARY: 'from-[#f59e0b] to-[#ea580c]',
};

const rarityLabel: Record<Difficulty, string> = {
  EASY: 'Común',
  MEDIUM: 'Raro',
  HARD: 'Épico',
  LEGENDARY: 'Legendario',
};

const rarityTextColor: Record<Difficulty, string> = {
  EASY: 'text-[#22c55e]',
  MEDIUM: 'text-[#3b82f6]',
  HARD: 'text-[#8b5cf6]',
  LEGENDARY: 'text-[#f59e0b]',
};

const sizeConfig = {
  sm: { container: 'w-12 h-12', ring: 'w-14 h-14', badge: 'w-10 h-10', text: 'text-[9px]' },
  md: { container: 'w-16 h-16', ring: 'w-[4.5rem] h-[4.5rem]', badge: 'w-14 h-14', text: 'text-[10px]' },
  lg: { container: 'w-24 h-24', ring: 'w-[6.5rem] h-[6.5rem]', badge: 'w-[5.5rem] h-[5.5rem]', text: 'text-xs' },
  xl: { container: 'w-32 h-32', ring: 'w-[8.5rem] h-[8.5rem]', badge: 'w-28 h-28', text: 'text-sm' },
};

function badgeIdToPath(badgeId: string): string {
  return `/badges/${badgeId.toLowerCase().replace(/_/g, '-')}.svg`;
}

export function AchievementBadgeDisplay({
  badgeId,
  name,
  rarity,
  isUnlocked,
  size = 'md',
  className,
  showGlow = true,
}: AchievementBadgeDisplayProps) {
  const dims = sizeConfig[size];
  const badgePath = badgeIdToPath(badgeId);

  if (!isUnlocked) {
    return (
      <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
        <div className={cn(dims.ring, 'rounded-full bg-[var(--surface-sunken)] flex items-center justify-center')}>
          <div className={cn(dims.badge, 'rounded-full bg-[var(--surface-elevated)] flex items-center justify-center opacity-30')}>
            <Lock className={cn(size === 'xl' ? 'w-8 h-8' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4', 'text-[var(--text-tertiary)]')} />
          </div>
        </div>
        <span className={cn(dims.text, 'text-[var(--text-tertiary)] text-center leading-tight max-w-[80px] line-clamp-2')}>
          ???
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-1 group', className)}>
      {/* Outer glow ring */}
      <div
        className={cn(
          dims.ring,
          'rounded-full bg-gradient-to-br p-[3px]',
          rarityRing[rarity],
          showGlow && rarityGlow[rarity],
          'transition-all duration-300 group-hover:scale-110',
        )}
      >
        {/* Inner circle with badge */}
        <div
          className={cn(
            dims.badge,
            'rounded-full bg-[#0a0a1a] flex items-center justify-center overflow-hidden',
            'transition-transform duration-300',
          )}
        >
          <img
            src={badgePath}
            alt={name}
            className={cn('object-contain', size === 'xl' ? 'w-[80%] h-[80%]' : 'w-[75%] h-[75%]')}
            onError={(e) => {
              // Fallback to sparkle icon if SVG not found
              const target = e.currentTarget;
              target.style.display = 'none';
              target.parentElement!.innerHTML =
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${rarityTextColor[rarity]}"><path d="M12 2l2.4 7.2L22 9l-5.6 4.8L18 21l-6-4.6L6 21l1.6-7.2L2 9l7.6.2z"/></svg>`;
            }}
          />
        </div>
      </div>

      {/* Sparkle particles on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Sparkles
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 animate-ping',
            rarityTextColor[rarity],
          )}
        />
        <Sparkles
          className={cn(
            'absolute -bottom-1 -left-1 w-2 h-2 animate-ping',
            rarityTextColor[rarity],
          )}
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          dims.text,
          'text-[var(--text-primary)] text-center font-medium leading-tight max-w-[100px] line-clamp-2',
        )}
      >
        {name}
      </span>

      {/* Rarity tag */}
      <span className={cn('text-[10px] font-semibold uppercase tracking-wider', rarityTextColor[rarity])}>
        {rarityLabel[rarity]}
      </span>
    </div>
  );
}
