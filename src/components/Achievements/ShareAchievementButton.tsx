'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { ShareAchievementModal } from './ShareAchievementModal';
import type { Difficulty } from '@/hooks/useAchievements';

interface Props {
  badgeId: string;
  name: string;
  rarity: Difficulty;
  xpReward: number;
  userName?: string;
}

export function ShareAchievementButton({ badgeId, name, rarity, xpReward, userName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-muted hover:text-fg-primary"
        title="Compartir logro"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <ShareAchievementModal
        open={open}
        onOpenChange={setOpen}
        badgeId={badgeId}
        achievementName={name}
        rarity={rarity}
        xpReward={xpReward}
        userName={userName || ''}
      />
    </>
  );
}
