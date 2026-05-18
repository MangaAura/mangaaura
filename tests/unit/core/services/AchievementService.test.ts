import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AchievementService,
  type UserAchievement,
  type AchievementUnlockedEvent,
  type AchievementListener,
} from '@/core/services/AchievementService';
import type {
  IAchievementRepository,
  Achievement,
  AchievementCondition,
  UserStats,
} from '@/core/services/IAchievementRepository';

// ─── Helpers / Factories ────────────────────────────────────────────

function mockAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: overrides.id ?? 'ach-1',
    badgeId: overrides.badgeId ?? 'racha-7',
    name: overrides.name ?? 'Racha de 7 días',
    description: overrides.description ?? 'Mantén una racha de lectura de 7 días',
    xpReward: overrides.xpReward ?? 50,
    iconUrl: overrides.iconUrl ?? null,
    condition: overrides.condition ?? { type: 'STREAK_REACHED', days: 7 },
    category: overrides.category ?? 'READING',
    difficulty: overrides.difficulty ?? 'EASY',
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
  };
}

function mockUserStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    chaptersRead: overrides.chaptersRead ?? 0,
    commentsPosted: overrides.commentsPosted ?? 0,
    correctionsApproved: overrides.correctionsApproved ?? 0,
    mangasCompleted: overrides.mangasCompleted ?? 0,
    commentLikesReceived: overrides.commentLikesReceived ?? 0,
    mangasCreated: overrides.mangasCreated ?? 0,
    sponsorshipsWon: overrides.sponsorshipsWon ?? 0,
    currentLevel: overrides.currentLevel ?? 1,
    readingStreak: overrides.readingStreak ?? 0,
    questsCompleted: overrides.questsCompleted ?? 0,
  };
}

function createMockRepo(overrides: Partial<IAchievementRepository> = {}): IAchievementRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findByBadgeId: vi.fn().mockResolvedValue(null),
    isUnlocked: vi.fn().mockResolvedValue(false),
    createUserAchievement: vi.fn().mockResolvedValue(undefined),
    getUserStats: vi.fn().mockResolvedValue(mockUserStats()),
    getTotalXPEarned: vi.fn().mockResolvedValue(0),
    getUserAchievementRecords: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function createMockXpService(): {
  addXP: ReturnType<typeof vi.fn>;
} {
  return { addXP: vi.fn().mockResolvedValue(undefined) };
}

// ─── AchievementService ─────────────────────────────────────────────

describe('AchievementService', () => {
  let repo: IAchievementRepository;
  let xpService: { addXP: ReturnType<typeof vi.fn> };
  let service: AchievementService;

  beforeEach(() => {
    repo = createMockRepo();
    xpService = createMockXpService();
    service = new AchievementService(repo, xpService);
  });

  // ─── checkAchievements ──────────────────────────────────────────

  describe('checkAchievements', () => {
    it('returns empty array when there are no achievements defined', async () => {
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.checkAchievements('user-1');
      expect(result).toEqual([]);
    });

    it('returns empty array when no conditions are met', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          condition: { type: 'CHAPTERS_READ', count: 100 },
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 5 })
      );

      const result = await service.checkAchievements('user-1');
      expect(result).toEqual([]);
      expect(repo.createUserAchievement).not.toHaveBeenCalled();
    });

    it('unlocks achievements whose conditions are met', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          badgeId: 'racha-7',
          condition: { type: 'STREAK_REACHED', days: 7 },
          xpReward: 50,
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievements[0]);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      const result = await service.checkAchievements('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].badgeId).toBe('racha-7');
      expect(result[0].xpReward).toBe(50);
      expect(result[0].userId).toBe('user-1');
      expect(repo.createUserAchievement).toHaveBeenCalledWith('user-1', 'ach-1');
    });

    it('skips achievements already unlocked', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', badgeId: 'badge-skip-1', condition: { type: 'STREAK_REACHED', days: 7 } }),
        mockAchievement({ id: 'ach-2', badgeId: 'badge-skip-2', condition: { type: 'CHAPTERS_READ', count: 10 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockImplementation(
        (badgeId: string) => Promise.resolve(achievements.find(a => a.badgeId === badgeId) || null)
      );
      (repo.isUnlocked as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(true)  // ach-1 already unlocked
        .mockResolvedValueOnce(false); // ach-2 not unlocked
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 15 })
      );

      const result = await service.checkAchievements('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].badgeId).toBe('badge-skip-2');
      expect(repo.createUserAchievement).toHaveBeenCalledTimes(1);
      expect(repo.createUserAchievement).toHaveBeenCalledWith('user-1', 'ach-2');
    });

    it('awards XP via xpService on unlock', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          badgeId: 'capitulos-100',
          condition: { type: 'CHAPTERS_READ', count: 100 },
          xpReward: 200,
          name: 'Lector Voraz',
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievements[0]);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 150 })
      );

      await service.checkAchievements('user-1');

      expect(xpService.addXP).toHaveBeenCalledTimes(1);
      expect(xpService.addXP).toHaveBeenCalledWith(
        'user-1',
        200,
        'ACHIEVEMENT_UNLOCKED',
        'Logro desbloqueado: Lector Voraz'
      );
    });

    it('does not award XP when xpService is null', async () => {
      const serviceNoXp = new AchievementService(repo);
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'CHAPTERS_READ', count: 10 }, xpReward: 100 }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievements[0]);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 20 })
      );

      // Should not throw
      const result = await serviceNoXp.checkAchievements('user-1');
      expect(result).toHaveLength(1);
    });

    it('notifies listeners when achievements are unlocked', async () => {
      const listener = vi.fn().mockResolvedValue(undefined);
      service.onAchievementUnlocked(listener);

      const achievements = [
        mockAchievement({
          id: 'ach-1',
          badgeId: 'racha-7',
          condition: { type: 'STREAK_REACHED', days: 7 },
          xpReward: 50,
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievements[0]);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      await service.checkAchievements('user-1');

      expect(listener).toHaveBeenCalledTimes(1);
      const event: AchievementUnlockedEvent = listener.mock.calls[0][0];
      expect(event.badgeId).toBe('racha-7');
      expect(event.userId).toBe('user-1');
      expect(event.xpReward).toBe(50);
    });

    it('continues notifying other listeners if one throws', async () => {
      const failingListener: AchievementListener = vi.fn().mockRejectedValue(new Error('fail'));
      const goodListener: AchievementListener = vi.fn().mockResolvedValue(undefined);

      service.onAchievementUnlocked(failingListener);
      service.onAchievementUnlocked(goodListener);

      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'STREAK_REACHED', days: 7 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievements[0]);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      // Should not throw
      await service.checkAchievements('user-1');
      expect(failingListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });

    it('unlocks multiple achievements in one check', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', badgeId: 'badge-1', condition: { type: 'CHAPTERS_READ', count: 5 }, xpReward: 10 }),
        mockAchievement({ id: 'ach-2', badgeId: 'badge-2', condition: { type: 'STREAK_REACHED', days: 3 }, xpReward: 20 }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockImplementation(
        (badgeId: string) => Promise.resolve(achievements.find(a => a.badgeId === badgeId) || null)
      );
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 10, readingStreak: 5 })
      );

      const result = await service.checkAchievements('user-1');

      expect(result).toHaveLength(2);
      expect(repo.createUserAchievement).toHaveBeenCalledTimes(2);
      expect(xpService.addXP).toHaveBeenCalledTimes(2);
    });
  });

  // ─── checkAchievement (single) ──────────────────────────────────

  describe('checkAchievement (single)', () => {
    it('returns true when condition is met', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        condition: { type: 'STREAK_REACHED', days: 7 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      const result = await service.checkAchievement('user-1', 'racha-7');
      expect(result).toBe(true);
    });

    it('returns false when condition is not met', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        condition: { type: 'STREAK_REACHED', days: 7 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 3 })
      );

      const result = await service.checkAchievement('user-1', 'racha-7');
      expect(result).toBe(false);
    });

    it('returns false when already unlocked', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        condition: { type: 'STREAK_REACHED', days: 7 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await service.checkAchievement('user-1', 'racha-7');
      expect(result).toBe(false);
      expect(repo.createUserAchievement).not.toHaveBeenCalled();
    });

    it('throws when achievement badgeId is not found', async () => {
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.checkAchievement('user-1', 'nonexistent')
      ).rejects.toThrow('Logro no encontrado: nonexistent');
    });

    it('does not trigger unlock side effects (only checks condition)', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        condition: { type: 'STREAK_REACHED', days: 7 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      await service.checkAchievement('user-1', 'racha-7');

      // checkAchievement only checks, doesn't unlock
      expect(repo.createUserAchievement).not.toHaveBeenCalled();
      expect(xpService.addXP).not.toHaveBeenCalled();
    });
  });

  // ─── unlockAchievement ──────────────────────────────────────────

  describe('unlockAchievement', () => {
    it('unlocks an achievement and returns the event', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        name: 'Racha de 7 días',
        xpReward: 50,
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await service.unlockAchievement('user-1', 'racha-7');

      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe('racha-7');
      expect(result!.achievementName).toBe('Racha de 7 días');
      expect(result!.xpReward).toBe(50);
      expect(result!.userId).toBe('user-1');
      expect(result!.unlockedAt).toBeInstanceOf(Date);
      expect(repo.createUserAchievement).toHaveBeenCalledWith('user-1', 'ach-1');
    });

    it('returns null when achievement is already unlocked', async () => {
      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7' });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await service.unlockAchievement('user-1', 'racha-7');

      expect(result).toBeNull();
      expect(repo.createUserAchievement).not.toHaveBeenCalled();
      expect(xpService.addXP).not.toHaveBeenCalled();
    });

    it('throws when achievement badgeId is not found', async () => {
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.unlockAchievement('user-1', 'nonexistent')
      ).rejects.toThrow('Logro no encontrado: nonexistent');
    });

    it('awards XP after unlocking', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'capitulos-100',
        name: 'Lector Voraz',
        xpReward: 200,
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await service.unlockAchievement('user-1', 'capitulos-100');

      expect(xpService.addXP).toHaveBeenCalledWith(
        'user-1',
        200,
        'ACHIEVEMENT_UNLOCKED',
        'Logro desbloqueado: Lector Voraz'
      );
    });

    it('unlocks even when xpService is null (no XP fallback)', async () => {
      const serviceNoXp = new AchievementService(repo);
      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7' });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await serviceNoXp.unlockAchievement('user-1', 'racha-7');

      expect(result).not.toBeNull();
      expect(repo.createUserAchievement).toHaveBeenCalled();
    });

    it('notifies listeners with the unlock event', async () => {
      const listener: AchievementListener = vi.fn().mockResolvedValue(undefined);
      service.onAchievementUnlocked(listener);

      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7', xpReward: 50 });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await service.unlockAchievement('user-1', 'racha-7');

      expect(listener).toHaveBeenCalledTimes(1);
      const event: AchievementUnlockedEvent = listener.mock.calls[0][0];
      expect(event.badgeId).toBe('racha-7');
      expect(event.xpReward).toBe(50);
      expect(event.unlockedAt).toBeInstanceOf(Date);
    });

    it('notifies multiple listeners', async () => {
      const listener1: AchievementListener = vi.fn().mockResolvedValue(undefined);
      const listener2: AchievementListener = vi.fn().mockResolvedValue(undefined);
      service.onAchievementUnlocked(listener1);
      service.onAchievementUnlocked(listener2);

      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7' });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await service.unlockAchievement('user-1', 'racha-7');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('continues if a listener throws (does not break unlock flow)', async () => {
      const failingListener: AchievementListener = vi.fn().mockRejectedValue(new Error('boom'));
      const goodListener: AchievementListener = vi.fn().mockResolvedValue(undefined);
      service.onAchievementUnlocked(failingListener);
      service.onAchievementUnlocked(goodListener);

      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7' });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      // Should not throw
      const result = await service.unlockAchievement('user-1', 'racha-7');
      expect(result).not.toBeNull();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  // ─── getUserAchievements ────────────────────────────────────────

  describe('getUserAchievements', () => {
    it('returns all achievements with unlock status and progress', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          badgeId: 'racha-7',
          condition: { type: 'STREAK_REACHED', days: 7 },
        }),
        mockAchievement({
          id: 'ach-2',
          badgeId: 'capitulos-10',
          condition: { type: 'CHAPTERS_READ', count: 10 },
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 5, readingStreak: 3 })
      );

      const result = await service.getUserAchievements('user-1');

      expect(result).toHaveLength(2);
      // ach-1: not unlocked, progress = readingStreak = 3, target = 7
      expect(result[0].isUnlocked).toBe(false);
      expect(result[0].progress).toBe(3);
      expect(result[0].target).toBe(7);
      // ach-2: not unlocked, progress = chaptersRead = 5, target = 10
      expect(result[1].isUnlocked).toBe(false);
      expect(result[1].progress).toBe(5);
      expect(result[1].target).toBe(10);
    });

    it('marks achievements as unlocked when user has them', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', badgeId: 'racha-7', condition: { type: 'STREAK_REACHED', days: 7 } }),
      ];
      const unlockedAt = new Date('2024-06-15');
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
        { achievementId: 'ach-1', unlockedAt },
      ]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ readingStreak: 10 })
      );

      const result = await service.getUserAchievements('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].isUnlocked).toBe(true);
      expect(result[0].unlockedAt).toEqual(unlockedAt);
      // Progress = readingStreak (10), target = days (7), capped at 7
      expect(result[0].progress).toBe(7);
    });

    it('returns empty array when no achievements defined', async () => {
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');
      expect(result).toEqual([]);
    });

    it('caps progress at target value', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          condition: { type: 'CHAPTERS_READ', count: 10 },
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 999 })
      );

      const result = await service.getUserAchievements('user-1');

      expect(result[0].progress).toBe(10); // capped at target
      expect(result[0].target).toBe(10);
    });

    it('includes mixed unlocked and locked achievements', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-locked', badgeId: 'badge-locked', condition: { type: 'CHAPTERS_READ', count: 100 } }),
        mockAchievement({ id: 'ach-unlocked', badgeId: 'badge-unlocked', condition: { type: 'STREAK_REACHED', days: 3 } }),
      ];
      const unlockedAt = new Date('2024-03-01');
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
        { achievementId: 'ach-unlocked', unlockedAt },
      ]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 5, readingStreak: 10 })
      );

      const result = await service.getUserAchievements('user-1');

      expect(result).toHaveLength(2);
      expect(result.find(a => a.id === 'ach-locked')!.isUnlocked).toBe(false);
      expect(result.find(a => a.id === 'ach-unlocked')!.isUnlocked).toBe(true);
    });
  });

  // ─── getUnlockedAchievements ────────────────────────────────────

  describe('getUnlockedAchievements', () => {
    it('returns only unlocked achievements', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'CHAPTERS_READ', count: 10 } }),
        mockAchievement({ id: 'ach-2', condition: { type: 'STREAK_REACHED', days: 3 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([
        { achievementId: 'ach-2', unlockedAt: new Date() },
      ]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUnlockedAchievements('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ach-2');
      expect(result[0].isUnlocked).toBe(true);
    });

    it('returns empty array when nothing is unlocked', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'CHAPTERS_READ', count: 100 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUnlockedAchievements('user-1');
      expect(result).toEqual([]);
    });
  });

  // ─── getTotalXPEarned ───────────────────────────────────────────

  describe('getTotalXPEarned', () => {
    it('delegates to the repository', async () => {
      (repo.getTotalXPEarned as ReturnType<typeof vi.fn>).mockResolvedValue(350);

      const result = await service.getTotalXPEarned('user-1');
      expect(result).toBe(350);
      expect(repo.getTotalXPEarned).toHaveBeenCalledWith('user-1');
    });

    it('returns 0 when user has no achievements', async () => {
      (repo.getTotalXPEarned as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.getTotalXPEarned('user-1');
      expect(result).toBe(0);
    });

    it('returns large XP totals correctly', async () => {
      (repo.getTotalXPEarned as ReturnType<typeof vi.fn>).mockResolvedValue(99999);

      const result = await service.getTotalXPEarned('user-1');
      expect(result).toBe(99999);
    });
  });

  // ─── Condition checking: all 10 types ───────────────────────────

  describe('condition checking (via checkAchievement)', () => {
    const conditionTestCases: Array<{
      type: AchievementCondition['type'];
      statKey: keyof UserStats;
      statValue: number;
      conditionValue: number;
      fieldName: 'count' | 'days' | 'level';
      description: string;
    }> = [
      { type: 'CHAPTERS_READ', statKey: 'chaptersRead', statValue: 100, conditionValue: 50, fieldName: 'count', description: 'CHAPTERS_READ' },
      { type: 'COMMENTS_POSTED', statKey: 'commentsPosted', statValue: 30, conditionValue: 20, fieldName: 'count', description: 'COMMENTS_POSTED' },
      { type: 'CORRECTIONS_APPROVED', statKey: 'correctionsApproved', statValue: 15, conditionValue: 10, fieldName: 'count', description: 'CORRECTIONS_APPROVED' },
      { type: 'MANGAS_COMPLETED', statKey: 'mangasCompleted', statValue: 5, conditionValue: 3, fieldName: 'count', description: 'MANGAS_COMPLETED' },
      { type: 'COMMENT_LIKES_RECEIVED', statKey: 'commentLikesReceived', statValue: 50, conditionValue: 25, fieldName: 'count', description: 'COMMENT_LIKES_RECEIVED' },
      { type: 'MANGAS_CREATED', statKey: 'mangasCreated', statValue: 3, conditionValue: 1, fieldName: 'count', description: 'MANGAS_CREATED' },
      { type: 'SPONSORSHIPS_WON', statKey: 'sponsorshipsWon', statValue: 1, conditionValue: 1, fieldName: 'count', description: 'SPONSORSHIPS_WON' },
      { type: 'LEVEL_REACHED', statKey: 'currentLevel', statValue: 10, conditionValue: 5, fieldName: 'level', description: 'LEVEL_REACHED' },
      { type: 'STREAK_REACHED', statKey: 'readingStreak', statValue: 30, conditionValue: 7, fieldName: 'days', description: 'STREAK_REACHED' },
      { type: 'QUESTS_COMPLETED', statKey: 'questsCompleted', statValue: 20, conditionValue: 10, fieldName: 'count', description: 'QUESTS_COMPLETED' },
    ];

    for (const tc of conditionTestCases) {
      it(`evaluates ${tc.description} correctly when stat meets condition`, async () => {
        const condition: AchievementCondition = { type: tc.type, [tc.fieldName]: tc.conditionValue } as AchievementCondition;
        const achievement = mockAchievement({ id: 'ach-1', badgeId: 'test-badge', condition });
        (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
        (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
        (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
          mockUserStats({ [tc.statKey]: tc.statValue })
        );

        const result = await service.checkAchievement('user-1', 'test-badge');
        expect(result).toBe(true);
      });

      it(`evaluates ${tc.description} correctly when stat does NOT meet condition`, async () => {
        const condition: AchievementCondition = { type: tc.type, [tc.fieldName]: tc.conditionValue } as AchievementCondition;
        const achievement = mockAchievement({ id: 'ach-1', badgeId: 'test-badge', condition });
        (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
        (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
        // Stat value below condition value
        const failingStats: Partial<UserStats> = { [tc.statKey]: tc.conditionValue - 1 };
        (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
          mockUserStats(failingStats)
        );

        const result = await service.checkAchievement('user-1', 'test-badge');
        expect(result).toBe(false);
      });
    }
  });

  // ─── Condition checking: exact boundary ─────────────────────────

  describe('condition boundary values', () => {
    it('unlocks when stat equals condition value (exact match)', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'test',
        condition: { type: 'CHAPTERS_READ', count: 10 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 10 })
      );

      const result = await service.checkAchievement('user-1', 'test');
      expect(result).toBe(true);
    });

    it('does not unlock when stat is one below condition', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'test',
        condition: { type: 'CHAPTERS_READ', count: 10 },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 9 })
      );

      const result = await service.checkAchievement('user-1', 'test');
      expect(result).toBe(false);
    });

    it('handles condition with missing count (defaults to 1)', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'test',
        condition: { type: 'CHAPTERS_READ' } as AchievementCondition, // no count
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUserStats({ chaptersRead: 1 })
      );

      const result = await service.checkAchievement('user-1', 'test');
      expect(result).toBe(true);
    });

    it('handles unknown condition type gracefully', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'test',
        condition: { type: 'UNKNOWN_TYPE' as unknown as AchievementCondition['type'] },
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.checkAchievement('user-1', 'test');
      expect(result).toBe(false);
    });
  });

  // ─── Progress calculation via getUserAchievements ───────────────

  describe('calculateProgress (via getUserAchievements)', () => {
    const conditionTypes: Array<{
      type: AchievementCondition['type'];
      statKey: keyof UserStats;
      expected: number;
      conditionValue: number;
      fieldName: 'count' | 'days' | 'level';
    }> = [
      { type: 'CHAPTERS_READ', statKey: 'chaptersRead', expected: 42, conditionValue: 100, fieldName: 'count' },
      { type: 'COMMENTS_POSTED', statKey: 'commentsPosted', expected: 15, conditionValue: 50, fieldName: 'count' },
      { type: 'CORRECTIONS_APPROVED', statKey: 'correctionsApproved', expected: 8, conditionValue: 20, fieldName: 'count' },
      { type: 'MANGAS_COMPLETED', statKey: 'mangasCompleted', expected: 3, conditionValue: 10, fieldName: 'count' },
      { type: 'COMMENT_LIKES_RECEIVED', statKey: 'commentLikesReceived', expected: 12, conditionValue: 100, fieldName: 'count' },
      { type: 'MANGAS_CREATED', statKey: 'mangasCreated', expected: 2, conditionValue: 5, fieldName: 'count' },
      { type: 'SPONSORSHIPS_WON', statKey: 'sponsorshipsWon', expected: 1, conditionValue: 5, fieldName: 'count' },
      { type: 'LEVEL_REACHED', statKey: 'currentLevel', expected: 7, conditionValue: 10, fieldName: 'level' },
      { type: 'STREAK_REACHED', statKey: 'readingStreak', expected: 5, conditionValue: 30, fieldName: 'days' },
      { type: 'QUESTS_COMPLETED', statKey: 'questsCompleted', expected: 4, conditionValue: 50, fieldName: 'count' },
    ];

    for (const ct of conditionTypes) {
      it(`maps ${ct.type} to ${ct.statKey} = ${ct.expected}`, async () => {
        const condition: AchievementCondition = { type: ct.type, [ct.fieldName]: ct.conditionValue } as AchievementCondition;
        const achievements = [mockAchievement({ id: 'ach-1', condition })];
        const userStats: Partial<UserStats> = { [ct.statKey]: ct.expected };

        (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
        (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats(userStats));

        const result = await service.getUserAchievements('user-1');

        expect(result).toHaveLength(1);
        expect(result[0].progress).toBe(ct.expected);
      });
    }

    it('returns 0 progress for unknown condition type', async () => {
      const achievements = [
        mockAchievement({
          id: 'ach-1',
          condition: { type: 'UNKNOWN' as unknown as AchievementCondition['type'] },
        }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');

      expect(result[0].progress).toBe(0);
    });
  });

  // ─── getTarget logic ────────────────────────────────────────────

  describe('getTarget (via getUserAchievements)', () => {
    it('returns count when present', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'CHAPTERS_READ', count: 42 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');
      expect(result[0].target).toBe(42);
    });

    it('returns level when count is absent', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'LEVEL_REACHED', level: 25 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');
      expect(result[0].target).toBe(25);
    });

    it('returns days when count and level are absent', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'STREAK_REACHED', days: 7 } }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');
      expect(result[0].target).toBe(7);
    });

    it('defaults to 1 when no count/level/days', async () => {
      const achievements = [
        mockAchievement({ id: 'ach-1', condition: { type: 'CHAPTERS_READ' } as AchievementCondition }),
      ];
      (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(achievements);
      (repo.getUserAchievementRecords as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (repo.getUserStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserStats());

      const result = await service.getUserAchievements('user-1');
      expect(result[0].target).toBe(1);
    });
  });

  // ─── Concurrent / edge-case behaviors ───────────────────────────

  describe('edge cases', () => {
    it('handles rapid sequential unlockAttempts for same achievement', async () => {
      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'racha-7' });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      // First call: not unlocked, second call: already unlocked
      (repo.isUnlocked as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result1 = await service.unlockAchievement('user-1', 'racha-7');
      const result2 = await service.unlockAchievement('user-1', 'racha-7');

      expect(result1).not.toBeNull();
      expect(result2).toBeNull();
      expect(repo.createUserAchievement).toHaveBeenCalledTimes(1);
      expect(xpService.addXP).toHaveBeenCalledTimes(1);
    });

    it('unlocks with 0 xpReward correctly', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'free-ach',
        xpReward: 0,
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await service.unlockAchievement('user-1', 'free-ach');

      expect(result).not.toBeNull();
      expect(result!.xpReward).toBe(0);
      expect(xpService.addXP).toHaveBeenCalledWith(
        'user-1',
        0,
        'ACHIEVEMENT_UNLOCKED',
        expect.any(String)
      );
    });

    it('handles achievements with null iconUrl', async () => {
      const achievement = mockAchievement({ id: 'ach-1', badgeId: 'no-icon', iconUrl: null });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await service.unlockAchievement('user-1', 'no-icon');
      expect(result).not.toBeNull();
    });

    it('preserves the exact event shape', async () => {
      const achievement = mockAchievement({
        id: 'ach-1',
        badgeId: 'racha-7',
        name: 'Racha de 7 días',
        xpReward: 50,
      });
      (repo.findByBadgeId as ReturnType<typeof vi.fn>).mockResolvedValue(achievement);
      (repo.isUnlocked as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await service.unlockAchievement('user-1', 'racha-7');

      expect(result).toMatchObject({
        userId: 'user-1',
        badgeId: 'racha-7',
        achievementName: 'Racha de 7 días',
        xpReward: 50,
      });
      expect(result!.unlockedAt).toBeInstanceOf(Date);
    });
  });
});
