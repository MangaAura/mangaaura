'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { AchievementBadgeDisplay } from '@/components/Achievements/AchievementBadgeDisplay';
import { ShareAchievementModal } from '@/components/Achievements/ShareAchievementModal';
import { UnlockAnimation } from '@/components/Achievements/UnlockAnimation';
import { Button } from '@/components/ui/Button';
import type { Difficulty } from '@/hooks/useAchievements';

interface AchievementDetailClientProps {
  achievement: {
    badgeId: string;
    name: string;
    rarity: Difficulty;
    xpReward: number;
    unlocked: boolean;
    wasJustUnlocked: boolean;
  };
}

export function AchievementDetailClient({ achievement }: AchievementDetailClientProps) {
  const { badgeId, name, rarity, xpReward, unlocked, wasJustUnlocked } = achievement;
  const [showShare, setShowShare] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  return (
    <>
      {/* Unlock celebration animation */}
      {wasJustUnlocked && !animationComplete && (
        <UnlockAnimation
          badgeId={badgeId}
          name={name}
          rarity={rarity}
          xpReward={xpReward}
          onComplete={() => setAnimationComplete(true)}
        />
      )}

      {/* Badge and share button */}
      <div className="relative group/badge">
        <AchievementBadgeDisplay
          badgeId={badgeId}
          name={name}
          rarity={rarity}
          isUnlocked={unlocked}
          size="xl"
          showGlow={unlocked}
        />

        {/* Share button overlay */}
        {unlocked && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShare(true)}
            className="absolute top-0 right-0 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200
                       bg-[var(--surface-elevated)]/80 backdrop-blur-sm hover:bg-[var(--surface-elevated)]"
            aria-label="Compartir logro"
          >
            <Share2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </Button>
        )}
      </div>

      {/* Share modal */}
      {unlocked && (
        <ShareAchievementModal
          open={showShare}
          onOpenChange={setShowShare}
          badgeId={badgeId}
          achievementName={name}
          rarity={rarity}
          xpReward={xpReward}
          userName=""
        />
      )}
    </>
  );
}
