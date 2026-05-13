/**
 * useAchievements Hook
 *
 * Hook para obtener logros del usuario.
 */

'use client';

import useSWR from 'swr';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';

interface AchievementCondition {
  type: string;
  count?: number;
  level?: number;
}

interface AchievementWithProgress {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  category: string;
  difficulty: Difficulty;
  condition: AchievementCondition | null;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
  percentage: number;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  totalXPEarned: number;
  completionPercentage: number;
}

interface AchievementsResponse {
  achievements: AchievementWithProgress[];
  stats: AchievementStats;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
});

export function useAchievements() {
  const { data, error, isLoading, mutate } = useSWR<AchievementsResponse>(
    '/api/achievements',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    achievements: data?.achievements ?? [],
    stats: data?.stats ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useAchievementStats() {
  const { data, error, isLoading } = useSWR<AchievementsResponse>(
    '/api/achievements',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    stats: data?.stats ?? null,
    isLoading,
    error,
  };
}

export function useUnlockAchievement() {
  const { mutate } = useAchievements();

  const unlockAchievement = async (badgeId: string) => {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badgeId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al desbloquear logro');
    }

    await mutate();
    return data;
  };

  return { unlockAchievement };
}

export type { AchievementWithProgress, AchievementStats, Difficulty, AchievementCondition };