'use client';

import { BookOpen, Zap, MessageSquare, Heart, BookOpenCheck, CheckCircle, MessagesSquare, Flame, Loader2 } from 'lucide-react';

import type { ActiveQuest } from '@/core/services/QuestService';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Zap,
  MessageSquare,
  Heart,
  BookOpenCheck,
  CheckCircle,
  MessagesSquare,
  Flame,
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  DAILY: {
    bg: 'bg-[var(--accent-blue)]/5',
    border: 'border-[var(--accent-blue)]/20',
    text: 'text-[var(--accent-blue)]',
    dot: 'bg-[var(--accent-blue)]',
  },
  WEEKLY: {
    bg: 'bg-[var(--accent-purple)]/5',
    border: 'border-[var(--accent-purple)]/20',
    text: 'text-[var(--accent-purple)]',
    dot: 'bg-[var(--accent-purple)]',
  },
  SPECIAL: {
    bg: 'bg-[var(--accent-red)]/5',
    border: 'border-[var(--accent-red)]/20',
    text: 'text-[var(--accent-red)]',
    dot: 'bg-[var(--accent-red)]',
  },
};

function formatTime(ms: number): string {
  if (ms <= 0) return '—';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface QuestCardProps {
  quest: ActiveQuest;
  onClaim?: (questId: string) => void;
  isClaiming?: boolean;
  compact?: boolean;
  className?: string;
}

export function QuestCard({
  quest,
  onClaim,
  isClaiming = false,
  compact = false,
  className,
}: QuestCardProps) {
  const Icon = ICON_MAP[quest.iconName] || BookOpen;
  const styles = CATEGORY_STYLES[quest.category] || CATEGORY_STYLES.DAILY;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-all',
          quest.completed && quest.claimed
            ? 'bg-[var(--surface-sunken)] border-[var(--border)] opacity-60'
            : quest.completed
              ? styles.bg + ' ' + styles.border
              : 'bg-[var(--surface-elevated)] border-[var(--border)]',
          className,
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            quest.completed && quest.claimed
              ? 'bg-[var(--surface-sunken)]'
              : quest.completed
                ? 'bg-[var(--accent-green)]/20'
                : 'bg-[var(--surface-sunken)]',
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              quest.completed && quest.claimed
                ? 'text-[var(--text-tertiary)]'
                : quest.completed
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--text-secondary)]',
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {quest.label}
            </p>
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', styles.bg, styles.text)}>
              {quest.category === 'DAILY' ? 'Diaria' : 'Semanal'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  quest.completed
                    ? 'bg-[var(--accent-green)]'
                    : 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]',
                )}
                style={{ width: `${quest.progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
              {quest.progress}/{quest.target}
            </span>
          </div>
        </div>

        {quest.completed && !quest.claimed && onClaim && (
          <button
            onClick={() => onClaim(quest.questId)}
            disabled={isClaiming}
            className="flex-shrink-0 px-2 py-1 text-[10px] font-semibold rounded-full bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green)]/80 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {isClaiming ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>+{quest.xpReward} XP</>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        quest.completed && quest.claimed
          ? 'bg-[var(--surface-sunken)] border-[var(--border)] opacity-60'
          : quest.completed
            ? styles.bg + ' ' + styles.border + ' shadow-sm'
            : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              quest.completed && quest.claimed
                ? 'bg-[var(--surface-sunken)]'
                : quest.completed
                  ? 'bg-[var(--accent-green)]/15'
                  : 'bg-[var(--surface-sunken)]',
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                quest.completed && quest.claimed
                  ? 'text-[var(--text-tertiary)]'
                  : quest.completed
                    ? 'text-[var(--accent-green)]'
                    : 'text-[var(--text-secondary)]',
              )}
            />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">
              {quest.label}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {quest.description}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-semibold',
            styles.bg,
            styles.text,
          )}
        >
          {quest.category === 'DAILY' ? 'Diaria' : 'Semanal'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            quest.completed
              ? 'bg-[var(--accent-green)]'
              : 'bg-gradient-to-r from-[var(--primary)] via-[var(--accent-purple)] to-[var(--accent-red)]',
          )}
          style={{ width: `${quest.progressPercent}%` }}
        />
        {!quest.completed && quest.progressPercent > 0 && (
          <div
            className="absolute inset-y-0 w-1 bg-white/30 rounded-full animate-pulse"
            style={{ left: `calc(${quest.progressPercent}% - 2px)` }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <span>
            {quest.progress}/{quest.target}
          </span>
          {quest.completed && quest.claimed && (
            <span className="text-[var(--accent-green)] flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Reclamado
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Time remaining */}
          <span className={cn(
            'text-[var(--text-tertiary)]',
            quest.timeRemaining < 3600000 && 'text-[var(--accent-red)]',
          )}>
            {quest.timeRemaining > 0 ? formatTime(quest.timeRemaining) : 'Expirado'}
          </span>

          {/* Rewards */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-purple)] font-medium">
              +{quest.xpReward} XP
            </span>
            {quest.inkcoinsReward > 0 && (
              <span className="text-[var(--accent-blue)] font-medium">
                +{quest.inkcoinsReward} 🪙
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Claim button */}
      {quest.completed && !quest.claimed && onClaim && (
        <button
          onClick={() => onClaim(quest.questId)}
          disabled={isClaiming}
          className="mt-3 w-full py-2 text-xs font-semibold rounded-lg bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green)]/85 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait disabled:active:scale-100"
        >
          {isClaiming ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Reclamando...
            </span>
          ) : (
            <>Reclamar +{quest.xpReward} XP{quest.inkcoinsReward > 0 ? ` + ${quest.inkcoinsReward} 🪙` : ''}</>
          )}
        </button>
      )}
    </div>
  );
}
