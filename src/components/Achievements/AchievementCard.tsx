'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Lock,
  Check,
  Star,
  Target,
  Zap,
  Flame,
  BookOpen,
  Heart,
  Users,
  MessageSquare,
  Crown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AchievementWithProgress, Difficulty } from '@/hooks/useAchievements';

interface AchievementUI {
  id: string;
  name: string;
  description: string;
  icon: string;
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

const iconMap: Record<string, typeof Trophy> = {
  Trophy,
  Star,
  Target,
  Zap,
  Flame,
  BookOpen,
  Heart,
  Users,
  MessageSquare,
  Crown,
};

const CATEGORY_ICONS: Record<string, string> = {
  READING: 'BookOpen',
  SOCIAL: 'MessageSquare',
  CREATION: 'Star',
  MILESTONE: 'Crown',
  general: 'Trophy',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
  LEGENDARY: 'Legendario',
};

export function adaptAchievement(ach: AchievementWithProgress): AchievementUI {
  const iconName = CATEGORY_ICONS[ach.category] || 'Trophy';
  const conditionType = ach.condition?.type || 'general';

  return {
    id: ach.id,
    name: ach.name,
    description: ach.description,
    icon: iconName,
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

export function AchievementCard({ achievement, showProgress = true }: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUnlocked = !!achievement.userAchievement;
  const progress = achievement.userAchievement?.progress || 0;
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.EASY;
  const Icon = iconMap[achievement.icon] || Trophy;

  return (
    <Card
      className={cn(
      'relative overflow-hidden transition-all duration-200 border',
      isUnlocked ? rarity.borderColor : 'border-custom',
      isHovered && 'scale-[1.02] -translate-y-0.5',
      isHovered && isUnlocked && 'shadow-lg',
      !isUnlocked && 'opacity-75'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              isUnlocked ? rarity.bgColor : 'bg-tertiary'
            )}
          >
            {isUnlocked ? (
              <Icon className={cn('w-7 h-7', rarity.color)} />
            ) : (
              <Lock className="w-6 h-6 text-muted" />
            )}
          </div>

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
          </div>
        </div>

        <h3
          className={cn(
            'font-semibold text-lg mb-2',
            isUnlocked ? '' : 'text-muted'
          )}
        >
          {achievement.name}
        </h3>
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
              {formatDistanceToNow(new Date(achievement.userAchievement!.earnedAt), {
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
  );
}

export function AchievementBadge({ achievement }: { achievement: AchievementUI }) {
  const isUnlocked = !!achievement.userAchievement;
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.EASY;
  const Icon = iconMap[achievement.icon] || Trophy;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg transition-all border',
        isUnlocked ? rarity.bgColor : 'bg-tertiary',
        isUnlocked && rarity.borderColor
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          isUnlocked ? rarity.bgColor : 'bg-tertiary'
        )}
      >
        {isUnlocked ? (
          <Icon className={cn('w-5 h-5', rarity.color)} />
        ) : (
          <Lock className="w-4 h-4 text-muted" />
        )}
      </div>
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