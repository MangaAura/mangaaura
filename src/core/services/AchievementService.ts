import type { IAchievementRepository, AchievementCondition, UserStats } from './IAchievementRepository';
import { getNotificationService } from './NotificationService';

export interface AchievementUnlockedEvent {
  userId: string;
  badgeId: string;
  achievementName: string;
  xpReward: number;
  unlockedAt: Date;
}

export type AchievementListener = (event: AchievementUnlockedEvent) => void | Promise<void>;

export interface UserAchievement {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string | null;
  condition: AchievementCondition;
  category: string;
  difficulty: string;
  unlockedAt: Date | null;
  progress: number;
  target: number;
  isUnlocked: boolean;
}

export class AchievementService {
  private listeners: AchievementListener[] = [];
  private xpService: { addXP: (userId: string, amount: number, source: string, description?: string) => Promise<void> } | null = null;

  constructor(
    private readonly achievementRepo: IAchievementRepository,
    xpService?: { addXP: (userId: string, amount: number, source: string, description?: string) => Promise<void> }
  ) {
    if (xpService) {
      this.xpService = xpService;
    }
  }

  onAchievementUnlocked(listener: AchievementListener): void {
    this.listeners.push(listener);
  }

  private async notifyListeners(event: AchievementUnlockedEvent): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error('Error en listener de logros:', error);
      }
    }
  }

  async checkAchievements(userId: string): Promise<AchievementUnlockedEvent[]> {
    const achievements = await this.achievementRepo.findAll();
    const unlocked: AchievementUnlockedEvent[] = [];

    for (const achievement of achievements) {
      const isAlreadyUnlocked = await this.achievementRepo.isUnlocked(userId, achievement.id);
      if (!isAlreadyUnlocked) {
        const shouldUnlock = await this.checkAchievementCondition(userId, achievement.condition);
        if (shouldUnlock) {
          const event = await this.unlockAchievement(userId, achievement.badgeId);
          if (event) {
            unlocked.push(event);
          }
        }
      }
    }

    return unlocked;
  }

  async checkAchievement(userId: string, badgeId: string): Promise<boolean> {
    const achievement = await this.achievementRepo.findByBadgeId(badgeId);
    if (!achievement) {
      throw new Error(`Logro no encontrado: ${badgeId}`);
    }

    const isAlreadyUnlocked = await this.achievementRepo.isUnlocked(userId, achievement.id);
    if (isAlreadyUnlocked) {
      return false;
    }

    return this.checkAchievementCondition(userId, achievement.condition);
  }

  async unlockAchievement(userId: string, badgeId: string): Promise<AchievementUnlockedEvent | null> {
    const achievement = await this.achievementRepo.findByBadgeId(badgeId);
    if (!achievement) {
      throw new Error(`Logro no encontrado: ${badgeId}`);
    }

    const isAlreadyUnlocked = await this.achievementRepo.isUnlocked(userId, achievement.id);
    if (isAlreadyUnlocked) {
      return null;
    }

    await this.achievementRepo.createUserAchievement(userId, achievement.id);

    if (this.xpService) {
      await this.xpService.addXP(
        userId,
        achievement.xpReward,
        'ACHIEVEMENT_UNLOCKED',
        `Logro desbloqueado: ${achievement.name}`
      );
    }

    const event: AchievementUnlockedEvent = {
      userId,
      badgeId: achievement.badgeId,
      achievementName: achievement.name,
      xpReward: achievement.xpReward,
      unlockedAt: new Date(),
    };

    await this.notifyListeners(event);

    try {
      const ns = await getNotificationService();
    await ns.notifyAchievementUnlocked(userId, {
      id: achievement.id,
      badgeId: achievement.badgeId,
      name: achievement.name,
      description: achievement.description,
      xpReward: achievement.xpReward,
      iconUrl: achievement.iconUrl,
    } as any);
    } catch (notifyError) {
      console.error('Error sending achievement notification:', notifyError);
    }

    return event;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const [allAchievements, userAchievements, stats] = await Promise.all([
      this.achievementRepo.findAll(),
      this.achievementRepo.getUserAchievementRecords(userId),
      this.achievementRepo.getUserStats(userId),
    ]);

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    return allAchievements.map(achievement => {
      const isUnlocked = unlockedIds.has(achievement.id);
      const progress = this.calculateProgress(achievement.condition, stats);
      const target = this.getTarget(achievement.condition);

      return {
        id: achievement.id,
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: achievement.condition,
        category: achievement.category,
        difficulty: achievement.difficulty,
        unlockedAt: isUnlocked ? userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt ?? null : null,
        progress: Math.min(progress, target),
        target,
        isUnlocked,
      };
    });
  }

  async getUnlockedAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.getUserAchievements(userId);
    return userAchievements.filter(ua => ua.isUnlocked);
  }

  async getTotalXPEarned(userId: string): Promise<number> {
    return this.achievementRepo.getTotalXPEarned(userId);
  }

  private async checkAchievementCondition(
    userId: string,
    condition: AchievementCondition
  ): Promise<boolean> {
    const stats = await this.achievementRepo.getUserStats(userId);

    switch (condition.type) {
      case 'CHAPTERS_READ':
        return stats.chaptersRead >= (condition.count || 1);
      case 'COMMENTS_POSTED':
        return stats.commentsPosted >= (condition.count || 1);
      case 'CORRECTIONS_APPROVED':
        return stats.correctionsApproved >= (condition.count || 1);
      case 'MANGAS_COMPLETED':
        return stats.mangasCompleted >= (condition.count || 1);
      case 'COMMENT_LIKES_RECEIVED':
        return stats.commentLikesReceived >= (condition.count || 1);
      case 'MANGAS_CREATED':
        return stats.mangasCreated >= (condition.count || 1);
      case 'SPONSORSHIPS_WON':
        return stats.sponsorshipsWon >= (condition.count || 1);
      case 'LEVEL_REACHED':
        return stats.currentLevel >= (condition.level || 1);
      case 'STREAK_REACHED':
        return stats.readingStreak >= (condition.days || 1);
      case 'QUESTS_COMPLETED':
        return stats.questsCompleted >= (condition.count || 1);
      default:
        return false;
    }
  }

  private calculateProgress(
    condition: AchievementCondition,
    stats: UserStats
  ): number {
    switch (condition.type) {
      case 'CHAPTERS_READ':
        return stats.chaptersRead;
      case 'COMMENTS_POSTED':
        return stats.commentsPosted;
      case 'CORRECTIONS_APPROVED':
        return stats.correctionsApproved;
      case 'MANGAS_COMPLETED':
        return stats.mangasCompleted;
      case 'COMMENT_LIKES_RECEIVED':
        return stats.commentLikesReceived;
      case 'MANGAS_CREATED':
        return stats.mangasCreated;
      case 'SPONSORSHIPS_WON':
        return stats.sponsorshipsWon;
      case 'LEVEL_REACHED':
        return stats.currentLevel;
      case 'STREAK_REACHED':
        return stats.readingStreak;
      case 'QUESTS_COMPLETED':
        return stats.questsCompleted;
      default:
        return 0;
    }
  }

  private getTarget(condition: AchievementCondition): number {
    if ('count' in condition && condition.count !== undefined) {
      return condition.count;
    }
    if ('level' in condition && condition.level !== undefined) {
      return condition.level;
    }
    if ('days' in condition && condition.days !== undefined) {
      return condition.days;
    }
    return 1;
  }
}

export let achievementService: AchievementService | undefined;

export function initializeAchievementService(
  repo: IAchievementRepository,
  xpService?: { addXP: (userId: string, amount: number, source: string, description?: string) => Promise<void> }
): AchievementService {
  const service = new AchievementService(repo, xpService);
  achievementService = service;
  return service;
}

export default AchievementService;
