import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Trophy, Target, Zap, Star, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { AchievementBadgeDisplay } from '@/components/Achievements/AchievementBadgeDisplay';
import { AchievementGrid } from '@/components/Achievements/AchievementGrid';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import type { Difficulty } from '@/hooks/useAchievements';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.achievements.title');
  const description = t('page.achievements.description');

  return {
    title,
    description,
  };
}

async function getAchievements() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const { prisma } = await import('@/lib/prisma');

    const userId = session.user.id;

    const [
      achievements,
      userAchievements,
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      questsCompleted,
      userLevel,
    ] = await Promise.all([
      prisma.achievementDefinition.findMany({
        orderBy: { xpReward: 'desc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      }),
      prisma.readingSession.count({ where: { userId, endedAt: { not: null } } }),
      prisma.comment.count({ where: { userId } }),
      prisma.chapterCorrection.count({ where: { userId, status: 'APPROVED' } }),
      prisma.userManga.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.commentLike.count({ where: { comment: { userId } } }),
      prisma.mangaSeries.count({ where: { authorId: userId } }),
      prisma.sponsorshipBid.count({ where: { userId, isWinning: true } }),
      prisma.userQuest.count({ where: { userId, completed: true } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { level: true, readingStreak: true },
      }),
    ]);

    const stats = {
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      questsCompleted,
      currentLevel: userLevel?.level ?? 1,
      readingStreak: userLevel?.readingStreak ?? 0,
    };

    const unlockedAchievementIds = new Set(
      userAchievements.map((ua) => ua.achievementId)
    );

    const achievementsWithProgress = achievements.map((ach) => {
      const unlocked = unlockedAchievementIds.has(ach.id);
      const condition = (() => { try { return JSON.parse(ach.condition); } catch { return null; } })();
      let target = 1;
      let progress = 0;

      if (condition) {
        target = condition.count || condition.level || condition.days || 1;
        switch (condition.type) {
          case 'CHAPTERS_READ':
            progress = Math.min(stats.chaptersRead, target);
            break;
          case 'MANGAS_CREATED':
            progress = Math.min(stats.mangasCreated, target);
            break;
          case 'MANGAS_COMPLETED':
            progress = Math.min(stats.mangasCompleted, target);
            break;
          case 'LEVEL_REACHED':
            progress = Math.min(stats.currentLevel, target);
            break;
          case 'STREAK_DAYS':
          case 'STREAK_REACHED':
          case 'READING_STREAK':
            progress = Math.min(stats.readingStreak, target);
            break;
          case 'QUESTS_COMPLETED':
            progress = Math.min(stats.questsCompleted, target);
            break;
          case 'COMMENTS_POSTED':
            progress = Math.min(stats.commentsPosted, target);
            break;
          case 'COMMENT_LIKES_RECEIVED':
          case 'LIKES_RECEIVED':
            progress = Math.min(stats.commentLikesReceived, target);
            break;
          case 'CORRECTIONS_APPROVED':
            progress = Math.min(stats.correctionsApproved, target);
            break;
          case 'SPONSORSHIPS_WON':
            progress = Math.min(stats.sponsorshipsWon, target);
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
        difficulty: ach.difficulty as Difficulty,
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

    const recentlyUnlocked = achievementsWithProgress
      .filter((a) => a.unlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 4);

    const byRarity = {
      EASY: achievementsWithProgress.filter((a) => a.difficulty === 'EASY' && a.unlocked).length,
      MEDIUM: achievementsWithProgress.filter((a) => a.difficulty === 'MEDIUM' && a.unlocked).length,
      HARD: achievementsWithProgress.filter((a) => a.difficulty === 'HARD' && a.unlocked).length,
      LEGENDARY: achievementsWithProgress.filter((a) => a.difficulty === 'LEGENDARY' && a.unlocked).length,
    };

    const totalByRarity = {
      EASY: achievementsWithProgress.filter((a) => a.difficulty === 'EASY').length,
      MEDIUM: achievementsWithProgress.filter((a) => a.difficulty === 'MEDIUM').length,
      HARD: achievementsWithProgress.filter((a) => a.difficulty === 'HARD').length,
      LEGENDARY: achievementsWithProgress.filter((a) => a.difficulty === 'LEGENDARY').length,
    };

    return {
      achievements: achievementsWithProgress,
      stats: {
        totalUnlocked,
        totalXP,
        totalAchievements: achievements.length,
        byRarity,
        totalByRarity,
      },
      recentlyUnlocked,
    };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return null;
  }
}

function CompletionRing({
  unlocked,
  total,
  size = 120,
  strokeWidth = 8,
}: {
  unlocked: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const percentage = total > 0 ? (unlocked / total) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={strokeWidth}
        />
      </svg>
      {/* Progress ring */}
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#completionGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-stat-ring"
          style={{
            '--ring-circumference': `${circumference}px`,
            '--ring-offset': `${offset}px`,
          } as React.CSSProperties}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold">{Math.round(percentage)}%</span>
        <span className="text-[10px] text-muted leading-tight">
          {unlocked}/{total}
        </span>
      </div>
    </div>
  );
}

export default async function AchievementsPage() {
  const session = await auth();
  const data = await getAchievements();

  const unlockedAchievements = data?.achievements.filter((a) => a.unlocked) ?? [];
  const lockedAchievements = data?.achievements.filter((a) => !a.unlocked) ?? [];
  const hasRecentlyUnlocked = (data?.recentlyUnlocked?.length ?? 0) > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6 min-h-screen bg-background font-sans text-fg-primary">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent-purple/20 rounded-2xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-accent-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Logros</h1>
            <p className="text-muted mt-1 text-sm">
              Completa objetivos y gana recompensas mientras lees manga
            </p>
          </div>
        </div>
      </div>

      {session?.user?.id && data?.stats && (
        <>
          {/* Stats cards + completion ring */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-5 border border-custom flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-orange/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-accent-orange" />
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Desbloqueados</p>
                <p className="text-2xl font-bold">
                  {data.stats.totalUnlocked}
                  <span className="text-sm text-muted font-normal ml-1">/ {data.stats.totalAchievements}</span>
                </p>
              </div>
            </Card>

            <Card className="p-5 border border-custom flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">XP Total</p>
                <p className="text-2xl font-bold">{data.stats.totalXP.toLocaleString('es')}</p>
              </div>
            </Card>

            <Card className="p-5 border border-custom flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-accent-green" />
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Legendarios</p>
                <p className="text-2xl font-bold">
                  {data.stats.byRarity.LEGENDARY}
                  <span className="text-sm text-muted font-normal ml-1">/ {data.stats.totalByRarity.LEGENDARY}</span>
                </p>
              </div>
            </Card>

            {/* Completion ring */}
            <Card className="p-5 border border-custom flex items-center justify-center gap-4">
              <CompletionRing
                unlocked={data.stats.totalUnlocked}
                total={data.stats.totalAchievements}
                size={80}
                strokeWidth={6}
              />
              <div>
                <p className="text-xs text-muted mb-0.5">Completado</p>
                <p className="text-lg font-bold">Sigue así</p>
              </div>
            </Card>
          </div>

          {/* Rarity breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {(['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'] as const).map((rarity) => {
              const rarityGradient: Record<string, string> = {
                EASY: 'from-[#22c55e] to-[#16a34a]',
                MEDIUM: 'from-[#3b82f6] to-[#2563eb]',
                HARD: 'from-[#8b5cf6] to-[#7c3aed]',
                LEGENDARY: 'from-[#f59e0b] to-[#ea580c]',
              };

              const rarityBg: Record<string, string> = {
                EASY: 'bg-[#22c55e]/10',
                MEDIUM: 'bg-[#3b82f6]/10',
                HARD: 'bg-[#8b5cf6]/10',
                LEGENDARY: 'bg-[#f59e0b]/10',
              };

              const unlocked = data.stats.byRarity[rarity] ?? 0;
              const total = data.stats.totalByRarity[rarity] ?? 0;
              const pct = total > 0 ? (unlocked / total) * 100 : 0;

              return (
                <Card key={rarity} className={cn('p-4 border border-custom', rarityBg[rarity])}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full bg-gradient-to-br',
                        rarityGradient[rarity]
                      )}
                    />
                    <span className="text-sm font-semibold capitalize">
                      {rarity === 'EASY' ? 'Común' : rarity === 'MEDIUM' ? 'Raro' : rarity === 'HARD' ? 'Épico' : 'Legendario'}
                    </span>
                  </div>
                  <p className="text-xl font-bold mb-1">
                    {unlocked}<span className="text-sm text-muted font-normal">/{total}</span>
                  </p>
                  <Progress value={pct} className="h-1.5" />
                </Card>
              );
            })}
          </div>

          {/* Recently unlocked showcase */}
          {hasRecentlyUnlocked && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--warning)]" />
                <h2 className="text-lg font-bold">Desbloqueados Recientemente</h2>
                <Sparkles className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.recentlyUnlocked.map((ach) => (
                  <Card
                    key={ach.id}
                    className={cn(
                      'p-6 border border-custom flex flex-col items-center gap-3',
                      'animate-badge-pop',
                      'hover:scale-105 transition-transform duration-200'
                    )}
                  >
                    <AchievementBadgeDisplay
                      badgeId={ach.badgeId}
                      name={ach.name}
                      rarity={ach.difficulty}
                      isUnlocked={true}
                      size="lg"
                      showGlow={true}
                    />
                    <p className="text-sm font-semibold text-center line-clamp-2">{ach.name}</p>
                    <span className="text-xs text-[var(--warning)] font-medium">
                      +{ach.xpReward} XP
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section: Unlocked achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-accent-green/20 rounded-full flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-accent-green" />
                </div>
                <h2 className="text-lg font-bold">
                  Desbloqueados ({unlockedAchievements.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.slice(0, 6).map((ach) => (
                  <Card
                    key={ach.id}
                    className={cn(
                      'p-4 border border-custom flex items-center gap-4',
                      'hover:scale-[1.02] transition-transform duration-200',
                      ach.difficulty === 'LEGENDARY' && 'border-[#f59e0b]/40'
                    )}
                  >
                    <AchievementBadgeDisplay
                      badgeId={ach.badgeId}
                      name={ach.name}
                      rarity={ach.difficulty}
                      isUnlocked={true}
                      size="md"
                      showGlow={ach.difficulty === 'LEGENDARY'}
                    />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm truncate">{ach.name}</h2>
                      <p className="text-xs text-muted line-clamp-1">{ach.description}</p>
                      <p className="text-xs text-[var(--warning)] mt-0.5 font-medium">+{ach.xpReward} XP</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section: Locked / In Progress */}
          {lockedAchievements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-tertiary rounded-full flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-muted" />
                </div>
                <h2 className="text-lg font-bold">
                  Por Desbloquear ({lockedAchievements.length})
                </h2>
              </div>
              <AchievementGrid
                achievements={data?.achievements ?? []}
                isLoading={!data && !!session?.user?.id}
                showStats={false}
              />
            </div>
          )}
        </>
      )}

      {/* Fallback: unauthenticated or no data */}
      {(!session?.user?.id || !data) && (
        <>
          <AchievementGrid
            achievements={data?.achievements ?? []}
            isLoading={!data && !!session?.user?.id}
          />
        </>
      )}

      {/* SVG gradient definition for completion ring */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
