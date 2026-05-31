import type { IAchievementRepository, Achievement, AchievementCondition, UserStats } from '@/core/services/IAchievementRepository';
import { PrismaClient, Prisma } from '@/generated/prisma/client';


export class PrismaAchievementRepository implements IAchievementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Achievement[]> {
    const achievements = await this.prisma.achievementDefinition.findMany({
      orderBy: [
        { xpReward: 'asc' },
      ],
    });
    return achievements.map(a => this.mapToAchievement(a));
  }

  async findByBadgeId(badgeId: string): Promise<Achievement | null> {
    const achievement = await this.prisma.achievementDefinition.findUnique({
      where: { badgeId },
    });
    if (!achievement) return null;
    return this.mapToAchievement(achievement);
  }

  async isUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const count = await this.prisma.userAchievement.count({
      where: { userId, achievementId },
    });
    return count > 0;
  }

  async createUserAchievement(userId: string, achievementId: string): Promise<void> {
    await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        unlockedAt: new Date(),
      },
    });
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const [
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      questsCompleted,
      user,
      genreProgress,
    ] = await Promise.all([
      this.prisma.readingSession.count({ where: { userId } }),
      this.prisma.comment.count({ where: { userId } }),
      this.prisma.chapterCorrection.count({ where: { userId, status: 'APPROVED' } }),
      this.prisma.userManga.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.commentLike.count({ where: { comment: { userId } } }),
      this.prisma.mangaSeries.count({ where: { authorId: userId } }),
      this.prisma.sponsorshipBid.count({ where: { userId, isWinning: true } }),
      this.prisma.userQuest.count({ where: { userId, completed: true } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { level: true, readingStreak: true } }),
      this.prisma.userGenreProgress.findMany({
        where: { userId },
        select: { genre: true, chaptersRead: true },
      }),
    ]);

    const genreChaptersRead: Record<string, number> = {};
    for (const gp of genreProgress) {
      genreChaptersRead[gp.genre] = gp.chaptersRead;
    }

    return {
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      questsCompleted,
      currentLevel: user?.level || 1,
      readingStreak: user?.readingStreak || 0,
      genreChaptersRead,
    };
  }

  async getTotalXPEarned(userId: string): Promise<number> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    return userAchievements.reduce((total, ua) => total + ua.achievement.xpReward, 0);
  }

  async getUserAchievementRecords(userId: string): Promise<Array<{ achievementId: string; unlockedAt: Date }>> {
    const records = await this.prisma.userAchievement.findMany({
      where: { userId },
    });
    return records.map(r => ({ achievementId: r.achievementId, unlockedAt: r.unlockedAt }));
  }

  private mapToAchievement(
    data: Prisma.AchievementDefinitionGetPayload<{}>
  ): Achievement {
    return {
      id: data.id,
      badgeId: data.badgeId,
      name: data.name,
      description: data.description,
      xpReward: data.xpReward,
      iconUrl: data.iconUrl,
      condition: JSON.parse(data.condition) as AchievementCondition,
      category: (data as unknown as { category?: string }).category || 'MILESTONE',
      difficulty: (data as unknown as { difficulty?: string }).difficulty || 'MEDIUM',
      createdAt: data.createdAt,
    };
  }
}
