'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Lock,
  Check,
  Star,
  Sparkles,
  Share2,
} from 'lucide-react';
import { useState } from 'react';

import { AchievementBadgeDisplay } from './AchievementBadgeDisplay';
import { ShareAchievementModal } from './ShareAchievementModal';
import { UnlockAnimation } from './UnlockAnimation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import type { AchievementWithProgress, Difficulty } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

export interface AchievementUI {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  category: string;
  rarity: Difficulty;
  points: number;
  requirement: number;
  requirementType: string;
  userAchievement?: {
    earnedAt: Date;
    progress: number;
  } | null;
}

interface AchievementCardProps {
  achievement: AchievementUI;
  showProgress?: boolean;
  showUnlockAnimation?: boolean;
  onAnimationComplete?: () => void;
}

const rarityConfig: Record<Difficulty, { color: string; bgColor: string; borderColor: string; gradient: string }> = {
  EASY: {
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/20',
    borderColor: 'border-accent-green/30',
    gradient: 'from-[var(--accent-green)] to-[var(--accent-green)]',
  },
  MEDIUM: {
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/20',
    borderColor: 'border-accent-blue/30',
    gradient: 'from-[var(--accent-blue)] to-[var(--accent-blue)]',
  },
  HARD: {
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/20',
    borderColor: 'border-accent-purple/30',
    gradient: 'from-[var(--accent-purple)] to-[var(--accent-purple)]',
  },
  LEGENDARY: {
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/20',
    borderColor: 'border-accent-orange/30',
    gradient: 'from-[var(--warning)] to-[var(--accent-orange)]',
  },
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
  LEGENDARY: 'Legendario',
};

export function adaptAchievement(ach: AchievementWithProgress): AchievementUI {
  const conditionType = ach.condition?.type || 'general';
  const rawBadgeId = (ach as { badgeId?: string }).badgeId;

  return {
    id: ach.id,
    badgeId: rawBadgeId || ach.id.toLowerCase().replace(/_/g, '-'),
    name: ach.name,
    description: ach.description,
    category: ach.category,
    rarity: (ach.difficulty as Difficulty) || 'EASY',
    points: ach.xpReward,
    requirement: ach.target,
    requirementType: conditionType,
    userAchievement: ach.unlocked
      ? {
          earnedAt: ach.unlockedAt ? new Date(ach.unlockedAt) : new Date(),
          progress: ach.progress,
        }
      : null,
  };
}

export function AchievementCard({
  achievement,
  showProgress = true,
  showUnlockAnimation = false,
  onAnimationComplete,
}: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showUnlock, setShowUnlock] = useState(showUnlockAnimation);
  const [showShare, setShowShare] = useState(false);
  const isUnlocked = !!achievement.userAchievement;
  const progress = achievement.userAchievement?.progress || 0;
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.EASY;
  const wasJustUnlocked = achievement.userAchievement?.earnedAt &&
    Date.now() - achievement.userAchievement.earnedAt.getTime() < 86400000;

  const handleClick = () => {
    if (isUnlocked && wasJustUnlocked) {
      setShowUnlock(true);
    }
  };

  return (
    <>
      {/* Unlock animation overlay */}
      {showUnlock && (
        <UnlockAnimation
          badgeId={achievement.badgeId}
          name={achievement.name}
          rarity={achievement.rarity}
          xpReward={achievement.points}
          onComplete={() => {
            setShowUnlock(false);
            onAnimationComplete?.();
          }}
        />
      )}

      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 border group/card',
          isUnlocked ? rarity.borderColor : 'border-custom',
          isHovered && 'scale-[1.02] -translate-y-0.5',
          isHovered && isUnlocked && 'shadow-lg',
          !isUnlocked && 'opacity-75',
          wasJustUnlocked && 'cursor-pointer animate-badge-pop'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Animated shimmer for legendary unlocked cards */}
        {isUnlocked && achievement.rarity === 'LEGENDARY' && (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent',
              'animate-rarity-shimmer pointer-events-none'
            )}
          />
        )}

        {isUnlocked && (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-10',
              rarity.gradient
            )}
          />
        )}

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            {/* Share button (unlocked only) */}
            {isUnlocked && (
              <button
                className={cn(
                  'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center',
                  'bg-[var(--surface-elevated)] border border-[var(--border)]',
                  'text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)]',
                  'transition-all duration-200 z-10',
                  'opacity-0 group-hover/card:opacity-100',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShare(true);
                }}
                title="Compartir logro"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Badge display */}
            <AchievementBadgeDisplay
              badgeId={achievement.badgeId}
              name={achievement.name}
              rarity={achievement.rarity}
              isUnlocked={isUnlocked}
              size="sm"
              showGlow={isUnlocked}
            />

            <div className="flex flex-col items-end gap-2">
              <Badge
                className={cn(
                  isUnlocked ? rarity.bgColor : 'bg-tertiary',
                  isUnlocked ? rarity.color : 'text-muted'
                )}
              >
                {DIFFICULTY_LABELS[achievement.rarity] || achievement.rarity}
              </Badge>
              {isUnlocked && (
                <Badge className="bg-accent-orange/20 text-accent-orange">
                  <Star className="w-3 h-3 mr-1" />
                  {achievement.points} XP
                </Badge>
              )}
              {wasJustUnlocked && (
                <Badge className="bg-accent-green/20 text-accent-green animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  ¡Nuevo!
                </Badge>
              )}
            </div>
          </div>

          <h2
            className={cn(
              'font-semibold text-lg mb-2',
              isUnlocked ? '' : 'text-muted'
            )}
          >
            {achievement.name}
          </h2>
          <p className="text-sm text-muted mb-4 line-clamp-2">
            {achievement.description}
          </p>

          {isUnlocked ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-accent-green/20 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-accent-green" />
              </div>
              <span className="text-accent-green">
                Desbloqueado{' '}
                {formatDistanceToNow(achievement.userAchievement!.earnedAt, {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          ) : showProgress ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Progreso</span>
                <span>
                  {progress} / {achievement.requirement}
                </span>
              </div>
              <Progress
                value={achievement.requirement > 0 ? (progress / achievement.requirement) * 100 : 0}
                className="h-2"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Lock className="w-4 h-4" />
              <span>Bloqueado</span>
            </div>
          )}
        </div>
      </Card>

      {/* Share modal */}
      <ShareAchievementModal
        open={showShare}
        onOpenChange={setShowShare}
        badgeId={achievement.badgeId}
        achievementName={achievement.name}
        rarity={achievement.rarity}
        xpReward={achievement.points}
        userName=""
      />
    </>
  );
}

export function AchievementBadge({ achievement }: { achievement: AchievementUI }) {
  const isUnlocked = !!achievement.userAchievement;
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.EASY;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg transition-all border',
        isUnlocked ? rarity.bgColor : 'bg-tertiary',
        isUnlocked && rarity.borderColor
      )}
    >
      <AchievementBadgeDisplay
        badgeId={achievement.badgeId}
        name={achievement.name}
        rarity={achievement.rarity}
        isUnlocked={isUnlocked}
        size="sm"
        showGlow={isUnlocked}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'font-medium text-sm truncate',
            isUnlocked ? '' : 'text-muted'
          )}
        >
          {achievement.name}
        </p>
        <p className="text-xs text-muted truncate">
          {isUnlocked
            ? `${achievement.points} XP`
            : `${achievement.requirement} requerido`}
        </p>
      </div>
    </div>
  );
}