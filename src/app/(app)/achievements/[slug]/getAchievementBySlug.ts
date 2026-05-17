import { auth } from '@/lib/auth';
import type { Difficulty } from '@/hooks/useAchievements';

// ─── Data types ─────────────────────────────────────────────────────

export interface AchievementDetailData {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  category: string;
  rarity: Difficulty;
  xpReward: number;
  condition: { type: string; count?: number; level?: number; days?: number } | null;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
  percentage: number;
}

export interface UserStats {
  chaptersRead: number;
  commentsPosted: number;
  correctionsApproved: number;
  mangasCompleted: number;
  commentLikesReceived: number;
  mangasCreated: number;
  sponsorshipsWon: number;
  questsCompleted: number;
  currentLevel: number;
  readingStreak: number;
}

interface AchievementDefRow {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  condition: unknown;
}

// ─── Data fetching ──────────────────────────────────────────────────

export async function getAchievementBySlug(
  slug: string,
): Promise<AchievementDetailData | null> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Case-insensitive lookup: fetch all definitions and filter in JS
    // (mode: 'insensitive' not supported on SQLite)
    const allDefinitions = await prisma.achievementDefinition.findMany();
    const normalizedSlug = slug.toLowerCase();
    const normalizedUnderscore = slug.replace(/-/g, '_').toLowerCase();

    const achievement = allDefinitions.find(
      (def: AchievementDefRow) =>
        def.badgeId.toLowerCase() === normalizedSlug ||
        def.id.toLowerCase() === normalizedSlug ||
        def.badgeId.toLowerCase() === normalizedUnderscore,
    );

    if (!achievement) return null;

    const session = await auth();
    const userId = session?.user?.id;

    let userAchievement: { unlockedAt: Date | null } | null = null;
    let userStats: UserStats | null = null;

    if (userId) {
      const [
        ua,
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
        prisma.userAchievement.findFirst({
          where: {
            userId,
            achievementId: achievement.id,
          },
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
      userAchievement = ua;
      userStats = {
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
    }

    const condition = (() => {
      try {
        return JSON.parse(achievement.condition);
      } catch {
        return null;
      }
    })();

    const target = condition?.count || condition?.level || condition?.days || 1;
    let progress = 0;

    if (userStats && condition) {
      switch (condition.type) {
        case 'CHAPTERS_READ':
          progress = Math.min(userStats.chaptersRead, target);
          break;
        case 'MANGAS_CREATED':
          progress = Math.min(userStats.mangasCreated, target);
          break;
        case 'MANGAS_COMPLETED':
          progress = Math.min(userStats.mangasCompleted, target);
          break;
        case 'LEVEL_REACHED':
          progress = Math.min(userStats.currentLevel, target);
          break;
        case 'STREAK_DAYS':
        case 'STREAK_REACHED':
        case 'READING_STREAK':
          progress = Math.min(userStats.readingStreak, target);
          break;
        case 'QUESTS_COMPLETED':
          progress = Math.min(userStats.questsCompleted, target);
          break;
        case 'COMMENTS_POSTED':
          progress = Math.min(userStats.commentsPosted, target);
          break;
        case 'COMMENT_LIKES_RECEIVED':
          progress = Math.min(userStats.commentLikesReceived, target);
          break;
        case 'CORRECTIONS_APPROVED':
          progress = Math.min(userStats.correctionsApproved, target);
          break;
        case 'SPONSORSHIPS_WON':
          progress = Math.min(userStats.sponsorshipsWon, target);
          break;
        default:
          progress = 0;
      }
    }

    return {
      id: achievement.id,
      badgeId: achievement.badgeId,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.difficulty as Difficulty,
      xpReward: achievement.xpReward,
      condition,
      unlocked: !!userAchievement?.unlockedAt,
      unlockedAt: userAchievement?.unlockedAt?.toISOString() || null,
      progress,
      target,
      percentage: target > 0 ? Math.round((progress / target) * 100) : 0,
    };
  } catch (error) {
    console.error('Error fetching achievement detail:', error);
    return null;
  }
}
