'use client';

import { Flame, Target, Trophy, Loader2, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { QuestCard } from './QuestCard';
import type { ActiveQuest } from '@/core/services/QuestService';
import { cn } from '@/lib/utils';

interface QuestPanelProps {
  className?: string;
  compact?: boolean;
}

interface QuestsResponse {
  quests: ActiveQuest[];
  todayXP: number;
  weekXP: number;
  dailyCompletions: number;
  dailyTotal: string;
  weeklyTotal: string;
  totalDailyXP: number;
  totalWeeklyXP: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function QuestPanel({ className, compact = false }: QuestPanelProps) {
  const { data, error, mutate } = useSWR<QuestsResponse>(
    '/api/gamification/quests',
    fetcher,
    { refreshInterval: 30000 }, // refresh every 30s
  );

  const [showCompletedDaily, setShowCompletedDaily] = useState(false);
  const [showCompletedWeekly, setShowCompletedWeekly] = useState(false);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);

  const handleClaim = useCallback(
    async (questId: string) => {
      setClaimingQuestId(questId);
      try {
        const res = await fetch('/api/gamification/quests/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questId }),
        });
        if (res.ok) {
          const data = await res.json();
          toast.success(data.label || 'Misión reclamada', {
            description: `+${data.xpAwarded ?? 0} XP${data.inkcoinsAwarded > 0 ? ` + ${data.inkcoinsAwarded} 🪙` : ''}`,
          });
          await mutate();
        } else {
          const errorData = await res.json().catch(() => null);
          toast.error(errorData?.error || 'Error al reclamar la misión');
        }
      } catch (err) {
        console.error('Error claiming quest:', err);
        toast.error('Error de conexión al reclamar');
      } finally {
        setClaimingQuestId(null);
      }
    },
    [mutate],
  );

  if (error) {
    return (
      <div
        className={cn(
          'p-6 text-center rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]',
          className,
        )}
      >
        <p className="text-sm text-[var(--text-tertiary)]">
          No se pudieron cargar las misiones
        </p>
        <button
          onClick={() => mutate()}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
        >
          <RotateCw className="w-3 h-3" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]',
          className,
        )}
      >
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  const { quests: questsList, todayXP, weekXP, totalDailyXP, totalWeeklyXP } = data;

  const dailyQuests = questsList.filter((q) => q.category === 'DAILY');
  const weeklyQuests = questsList.filter((q) => q.category === 'WEEKLY');

  const dailyCompleted = dailyQuests.filter((q) => q.completed || q.claimed).length;
  const weeklyCompleted = weeklyQuests.filter((q) => q.completed || q.claimed).length;

  const activeDailyQuests = dailyQuests.filter((q) => !q.claimed);
  const activeWeeklyQuests = weeklyQuests.filter((q) => !q.claimed);

  const completedDailyQuests = dailyQuests.filter((q) => q.claimed);
  const completedWeeklyQuests = weeklyQuests.filter((q) => q.claimed);

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Compact header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Misiones
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
            <span>+{todayXP} XP hoy</span>
          </div>
        </div>

        {/* Compact quest list */}
        {activeDailyQuests.slice(0, 2).map((quest) => (
          <QuestCard
            key={quest.questId}
            quest={quest}
            onClaim={handleClaim}
            isClaiming={claimingQuestId === quest.questId}
            compact
          />
        ))}

        {activeDailyQuests.length === 0 && activeWeeklyQuests.length > 0 && (
          <QuestCard
            key={activeWeeklyQuests[0].questId}
            quest={activeWeeklyQuests[0]}
            onClaim={handleClaim}
            isClaiming={claimingQuestId === activeWeeklyQuests[0].questId}
            compact
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header section */}
      <div className="rounded-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-sunken)] border border-[var(--border)] p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">
              Misiones
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Completa misiones para ganar XP y monedas
            </p>
          </div>
        </div>

        {/* XP summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--surface-sunken)] p-3 text-center">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              Diario
            </p>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent-red)]" />
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {todayXP}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                / {totalDailyXP} XP
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-red)] to-[var(--primary)] transition-all duration-500"
                style={{
                  width: `${totalDailyXP > 0 ? Math.round((todayXP / totalDailyXP) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-[var(--surface-sunken)] p-3 text-center">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
              Semanal
            </p>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {weekXP}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                / {totalWeeklyXP} XP
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] transition-all duration-500"
                style={{
                  width: `${totalWeeklyXP > 0 ? Math.round((weekXP / totalWeeklyXP) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily quests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Diarias
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium">
              {dailyCompleted}/{dailyQuests.length}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {activeDailyQuests.map((quest) => (
            <QuestCard
              key={quest.questId}
              quest={quest}
              onClaim={handleClaim}
              isClaiming={claimingQuestId === quest.questId}
            />
          ))}

          {completedDailyQuests.length > 0 && (
            <>
              <button
                onClick={() => setShowCompletedDaily(!showCompletedDaily)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showCompletedDaily ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Ocultar completadas
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    {completedDailyQuests.length} completada{completedDailyQuests.length > 1 ? 's' : ''}
                  </>
                )}
              </button>

              {showCompletedDaily &&
                completedDailyQuests.map((quest) => (
                  <QuestCard key={`done-${quest.questId}`} quest={quest} />
                ))}
            </>
          )}
        </div>
      </div>

      {/* Weekly quests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Semanales
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium">
              {weeklyCompleted}/{weeklyQuests.length}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {activeWeeklyQuests.map((quest) => (
            <QuestCard
              key={quest.questId}
              quest={quest}
              onClaim={handleClaim}
              isClaiming={claimingQuestId === quest.questId}
            />
          ))}

          {completedWeeklyQuests.length > 0 && (
            <>
              <button
                onClick={() => setShowCompletedWeekly(!showCompletedWeekly)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showCompletedWeekly ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Ocultar completadas
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    {completedWeeklyQuests.length} completada{completedWeeklyQuests.length > 1 ? 's' : ''}
                  </>
                )}
              </button>

              {showCompletedWeekly &&
                completedWeeklyQuests.map((quest) => (
                  <QuestCard key={`done-${quest.questId}`} quest={quest} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
