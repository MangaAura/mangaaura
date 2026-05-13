import type { Metadata } from 'next';
import { AchievementGrid } from '@/components/Achievements/AchievementGrid';
import { Card } from '@/components/ui/Card';
import { Trophy, Target, Zap } from 'lucide-react';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Logros | Inkverse',
  description: 'Descubre y desbloquea logros mientras lees manga',
};

async function getAchievements() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const { prisma } = await import('@/lib/prisma');

    const [achievements, userAchievements, user] = await Promise.all([
      prisma.achievementDefinition.findMany({
        orderBy: { xpReward: 'desc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          xpPoints: true,
          level: true,
          readingStreak: true,
          _count: {
            select: {
              readingProgress: true,
            },
          },
        },
      }),
    ]);

    const unlockedAchievementIds = new Set(
      userAchievements.map((ua) => ua.achievementId)
    );

    const achievementsWithProgress = achievements.map((ach) => {
      const unlocked = unlockedAchievementIds.has(ach.id);
      const condition = (() => { try { return JSON.parse(ach.condition); } catch { return null; } })();
      let target = 1;
      let progress = 0;

      if (condition && user) {
        target = condition.count || condition.level || 1;
        switch (condition.type) {
          case 'CHAPTERS_READ':
            progress = Math.min(user._count.readingProgress, target);
            break;
          case 'MANGAS_CREATED':
            progress = Math.min(user._count.readingProgress, target);
            break;
          case 'LEVEL_REACHED':
            progress = Math.min(user.level, target);
            break;
        }
      }

      return {
        id: ach.id,
        badgeId: ach.badgeId,
        name: ach.name,
        description: ach.description,
        iconUrl: ach.iconUrl,
        xpReward: ach.xpReward,
        category: ach.category,
        difficulty: ach.difficulty as import('@/hooks/useAchievements').Difficulty,
        condition,
        unlocked,
        unlockedAt: unlocked
          ? userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt?.toISOString() || null
          : null,
        progress,
        target,
        percentage: target > 0 ? Math.round((progress / target) * 100) : 0,
      };
    });

    const totalUnlocked = userAchievements.length;
    const totalXP = userAchievements.reduce((sum, ua) => {
      const ach = achievements.find((a) => a.id === ua.achievementId);
      return sum + (ach?.xpReward || 0);
    }, 0);

    return {
      achievements: achievementsWithProgress,
      stats: {
        totalUnlocked,
        totalXP,
        totalAchievements: achievements.length,
      },
    };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return null;
  }
}

export default async function AchievementsPage() {
  const session = await auth();
  const data = await getAchievements();

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6 min-h-screen bg-background font-sans text-fg-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 mt-4">
          Logros <Trophy className="text-accent-purple" size={24} />
        </h1>
        <p className="text-muted mt-2">
          Completa objetivos y gana recompensas mientras lees manga
        </p>
      </div>

      {session?.user?.id && data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Logros desbloqueados</p>
                <p className="text-3xl font-bold">
                  {data.stats.totalUnlocked}/{data.stats.totalAchievements}
                </p>
              </div>
              <div className="w-14 h-14 bg-accent-orange/20 rounded-full flex items-center justify-center">
                <Target className="w-7 h-7 text-accent-orange" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">XP Total</p>
                <p className="text-3xl font-bold">{data.stats.totalXP.toLocaleString('es')}</p>
              </div>
              <div className="w-14 h-14 bg-accent-blue/20 rounded-full flex items-center justify-center">
                <Zap className="w-7 h-7 text-accent-blue" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">Legendarios</p>
                <p className="text-3xl font-bold">
                  {data.achievements.filter((a) => a.difficulty === 'LEGENDARY' && a.unlocked).length}/
                  {data.achievements.filter((a) => a.difficulty === 'LEGENDARY').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-accent-purple/20 rounded-full flex items-center justify-center">
                <Trophy className="w-7 h-7 text-accent-purple" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <AchievementGrid
        achievements={data?.achievements ?? []}
        isLoading={!data && !!session?.user?.id}
      />
    </div>
  );
}