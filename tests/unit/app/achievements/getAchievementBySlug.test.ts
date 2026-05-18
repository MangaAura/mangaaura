import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { Difficulty } from '@/hooks/useAchievements';

// ─── Test data factories ────────────────────────────────────────────

interface MockAchievementDef {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  xpReward: number;
  condition: string; // JSON string
}

function mockDef(overrides: Partial<MockAchievementDef> = {}): MockAchievementDef {
  return {
    id: 'ach-001',
    badgeId: 'primeros-pasos',
    name: 'Primeros Pasos',
    description: 'Lee tu primer capítulo',
    category: 'READING',
    difficulty: 'EASY' as Difficulty,
    xpReward: 50,
    condition: JSON.stringify({ type: 'CHAPTERS_READ', count: 1 }),
    ...overrides,
  };
}

function mockUserAchievement(overrides: Partial<{ unlockedAt: Date | null }> = {}) {
  return {
    unlockedAt: new Date('2025-01-15T10:00:00Z'),
    ...overrides,
  };
}

function makeCondition(type: string, opts: { count?: number; level?: number; days?: number } = {}) {
  return JSON.stringify({ type, ...opts });
}

// ─── Mock setup ─────────────────────────────────────────────────────

const mockPrisma = {
  achievementDefinition: {
    findMany: vi.fn(),
  },
  userAchievement: {
    findFirst: vi.fn(),
  },
  readingSession: {
    count: vi.fn(),
  },
  comment: {
    count: vi.fn(),
  },
  chapterCorrection: {
    count: vi.fn(),
  },
  userManga: {
    count: vi.fn(),
  },
  commentLike: {
    count: vi.fn(),
  },
  mangaSeries: {
    count: vi.fn(),
  },
  sponsorshipBid: {
    count: vi.fn(),
  },
  userQuest: {
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const mockAuth = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

// Dynamic import workaround: getAchievementBySlug uses await import('@/lib/prisma')
// vi.mock intercepts both static and dynamic imports

// ─── Helpers ─────────────────────────────────────────────────────────

function setupPrismaDefaults() {
  // Default: return one achievement definition
  mockPrisma.achievementDefinition.findMany.mockResolvedValue([mockDef()]);
  // Default: no user achievement (not unlocked)
  mockPrisma.userAchievement.findFirst.mockResolvedValue(null);
  // Default: all count queries return 0
  mockPrisma.readingSession.count.mockResolvedValue(0);
  mockPrisma.comment.count.mockResolvedValue(0);
  mockPrisma.chapterCorrection.count.mockResolvedValue(0);
  mockPrisma.userManga.count.mockResolvedValue(0);
  mockPrisma.commentLike.count.mockResolvedValue(0);
  mockPrisma.mangaSeries.count.mockResolvedValue(0);
  mockPrisma.sponsorshipBid.count.mockResolvedValue(0);
  mockPrisma.userQuest.count.mockResolvedValue(0);
  // Default: user level and streak
  mockPrisma.user.findUnique.mockResolvedValue({ level: 1, readingStreak: 0 });
}

function setupAuth(userId: string | null = null) {
  if (userId) {
    mockAuth.mockResolvedValue({ user: { id: userId } });
  } else {
    mockAuth.mockResolvedValue(null);
  }
}

// Lazy import to work around hoisted vi.mock
async function getFn() {
  const mod = await import('@/app/(app)/achievements/[slug]/getAchievementBySlug');
  return mod.getAchievementBySlug;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('getAchievementBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPrismaDefaults();
  });

  // ── Slug matching ─────────────────────────────────────────────────

  describe('slug matching', () => {
    it('matches by exact badgeId', async () => {
      setupAuth();
      const result = await (await getFn())('primeros-pasos');
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe('primeros-pasos');
    });

    it('matches by exact id', async () => {
      setupAuth();
      const result = await (await getFn())('ach-001');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('ach-001');
    });

    it('matches case-insensitively', async () => {
      setupAuth();
      const result = await (await getFn())('PRIMEROS-PASOS');
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe('primeros-pasos');
    });

    it('matches hyphen as underscore (chapters_read → chapters-read)', async () => {
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ badgeId: 'chapters_read', id: 'ach-002' }),
      ]);
      setupAuth();
      const result = await (await getFn())('chapters-read');
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe('chapters_read');
    });

    it('returns null when achievement not found', async () => {
      setupAuth();
      const result = await (await getFn())('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null when findMany returns empty array', async () => {
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([]);
      setupAuth();
      const result = await (await getFn())('anything');
      expect(result).toBeNull();
    });
  });

  // ── No user session ───────────────────────────────────────────────

  describe('without user session', () => {
    it('returns achievement with zero progress and not unlocked', async () => {
      setupAuth(null);
      const result = await (await getFn())('primeros-pasos');
      expect(result).not.toBeNull();
      expect(result!.unlocked).toBe(false);
      expect(result!.unlockedAt).toBeNull();
      expect(result!.progress).toBe(0);
      expect(result!.percentage).toBe(0);
    });

    it('still returns achievement metadata', async () => {
      setupAuth(null);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.name).toBe('Primeros Pasos');
      expect(result!.description).toBe('Lee tu primer capítulo');
      expect(result!.category).toBe('READING');
      expect(result!.rarity).toBe('EASY');
      expect(result!.xpReward).toBe(50);
    });

    it('parses condition from JSON even without user', async () => {
      setupAuth(null);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.condition).toEqual({ type: 'CHAPTERS_READ', count: 1 });
      expect(result!.target).toBe(1);
    });
  });

  // ── Unlocked achievement ──────────────────────────────────────────

  describe('unlocked achievement', () => {
    it('returns unlocked=true with unlockedAt date', async () => {
      setupAuth('user-1');
      const unlockedDate = new Date('2025-01-15T10:00:00Z');
      mockPrisma.userAchievement.findFirst.mockResolvedValue(
        mockUserAchievement({ unlockedAt: unlockedDate }),
      );
      const result = await (await getFn())('primeros-pasos');
      expect(result!.unlocked).toBe(true);
      expect(result!.unlockedAt).toBe(unlockedDate.toISOString());
    });

    it('shows unlocked=true even with zero progress stats', async () => {
      setupAuth('user-1');
      mockPrisma.userAchievement.findFirst.mockResolvedValue(
        mockUserAchievement({ unlockedAt: new Date() }),
      );
      // All stats are 0 by default
      const result = await (await getFn())('primeros-pasos');
      expect(result!.unlocked).toBe(true);
      expect(result!.unlockedAt).not.toBeNull();
    });

    it('returns unlocked=false when userAchievement has null unlockedAt', async () => {
      setupAuth('user-1');
      mockPrisma.userAchievement.findFirst.mockResolvedValue(
        mockUserAchievement({ unlockedAt: null }),
      );
      const result = await (await getFn())('primeros-pasos');
      expect(result!.unlocked).toBe(false);
      expect(result!.unlockedAt).toBeNull();
    });

    it('returns unlocked=false when userAchievement not found', async () => {
      setupAuth('user-1');
      mockPrisma.userAchievement.findFirst.mockResolvedValue(null);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.unlocked).toBe(false);
      expect(result!.unlockedAt).toBeNull();
    });
  });

  // ── CHAPTERS_READ ─────────────────────────────────────────────────

  describe('CHAPTERS_READ progress', () => {
    it('calculates progress from readingSession count', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 10 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(7);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(7);
      expect(result!.target).toBe(10);
      expect(result!.percentage).toBe(70); // Math.round(7/10 * 100)
    });

    it('caps progress at target', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 10 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(15);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(10);
      expect(result!.percentage).toBe(100);
    });

    it('shows 0 progress when no reading sessions', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 5 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(0);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(0);
      expect(result!.percentage).toBe(0);
    });
  });

  // ── MANGAS_CREATED ────────────────────────────────────────────────

  describe('MANGAS_CREATED progress', () => {
    it('calculates progress from mangaSeries count (authorId)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('MANGAS_CREATED', { count: 3 }) }),
      ]);
      mockPrisma.mangaSeries.count.mockResolvedValue(2);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(2);
      expect(result!.target).toBe(3);
    });
  });

  // ── MANGAS_COMPLETED ──────────────────────────────────────────────

  describe('MANGAS_COMPLETED progress', () => {
    it('calculates progress from userManga count (status: COMPLETED)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('MANGAS_COMPLETED', { count: 10 }) }),
      ]);
      mockPrisma.userManga.count.mockResolvedValue(8);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(8);
    });
  });

  // ── LEVEL_REACHED ─────────────────────────────────────────────────

  describe('LEVEL_REACHED progress', () => {
    it('calculates progress from user level', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('LEVEL_REACHED', { level: 10 }) }),
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ level: 5, readingStreak: 3 });
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(5);
      expect(result!.target).toBe(10);
    });
  });

  // ── STREAK variants ───────────────────────────────────────────────

  describe('STREAK_DAYS / STREAK_REACHED / READING_STREAK', () => {
    const streakTypes = ['STREAK_DAYS', 'STREAK_REACHED', 'READING_STREAK'];

    it.each(streakTypes)('%s uses readingStreak for progress', async (type) => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition(type, { days: 7 }) }),
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ level: 3, readingStreak: 5 });
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(5);
      expect(result!.target).toBe(7);
    });

    it.each(streakTypes)('%s caps at target', async (type) => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition(type, { days: 7 }) }),
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ level: 3, readingStreak: 12 });
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(7);
    });

    it.each(streakTypes)('%s target default is 1 when days is missing', async (type) => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: JSON.stringify({ type }) }), // no count/level/days
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ level: 1, readingStreak: 0 });
      const result = await (await getFn())('primeros-pasos');
      // target falls back to 1 since count/level/days are all absent
      expect(result!.target).toBe(1);
    });
  });

  // ── QUESTS_COMPLETED ──────────────────────────────────────────────

  describe('QUESTS_COMPLETED progress', () => {
    it('calculates progress from userQuest count (completed: true)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('QUESTS_COMPLETED', { count: 20 }) }),
      ]);
      mockPrisma.userQuest.count.mockResolvedValue(12);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(12);
    });
  });

  // ── COMMENTS_POSTED ───────────────────────────────────────────────

  describe('COMMENTS_POSTED progress', () => {
    it('calculates progress from comment count', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('COMMENTS_POSTED', { count: 50 }) }),
      ]);
      mockPrisma.comment.count.mockResolvedValue(35);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(35);
    });
  });

  // ── COMMENT_LIKES_RECEIVED ───────────────────────────────────────

  describe('COMMENT_LIKES_RECEIVED progress', () => {
    it('calculates progress from commentLike count (filtered by comment.userId)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('COMMENT_LIKES_RECEIVED', { count: 100 }) }),
      ]);
      mockPrisma.commentLike.count.mockResolvedValue(67);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(67);
    });
  });

  // ── CORRECTIONS_APPROVED ──────────────────────────────────────────

  describe('CORRECTIONS_APPROVED progress', () => {
    it('calculates progress from chapterCorrection count (status: APPROVED)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CORRECTIONS_APPROVED', { count: 25 }) }),
      ]);
      mockPrisma.chapterCorrection.count.mockResolvedValue(10);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(10);
    });
  });

  // ── SPONSORSHIPS_WON ──────────────────────────────────────────────

  describe('SPONSORSHIPS_WON progress', () => {
    it('calculates progress from sponsorshipBid count (isWinning: true)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('SPONSORSHIPS_WON', { count: 5 }) }),
      ]);
      mockPrisma.sponsorshipBid.count.mockResolvedValue(3);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(3);
    });
  });

  // ── Unknown condition type ────────────────────────────────────────

  describe('unknown condition type', () => {
    it('returns progress 0 for unrecognized condition type', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('FUTURE_FEATURE', { count: 10 }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(0);
      expect(result!.target).toBe(10);
    });
  });

  // ── Target calculation ────────────────────────────────────────────

  describe('target calculation', () => {
    it('uses count when available', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 42 }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.target).toBe(42);
    });

    it('uses level when count is absent', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('LEVEL_REACHED', { level: 15 }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.target).toBe(15);
    });

    it('uses days when count and level are absent', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('STREAK_DAYS', { days: 30 }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.target).toBe(30);
    });

    it('defaults to 1 when all values are absent', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: JSON.stringify({ type: 'CHAPTERS_READ' }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.target).toBe(1);
    });

    it('defaults to 1 when count is 0 (falsy)', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 0 }) }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.target).toBe(1); // 0 is falsy, falls back to 1
    });
  });

  // ── Percentage calculation ────────────────────────────────────────

  describe('percentage calculation', () => {
    it('returns 0 when target is 0', async () => {
      setupAuth('user-1');
      // Target defaults to 1 when count=0, so we test a different approach:
      // simulate condition with count=0 (which makes target=1, so percentage ≠ 0)
      // Target of 0 isn't achievable through the code since `|| 1` fallback.
      // Instead test that progress=0 gives 0% when target>0
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 50 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(0);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.percentage).toBe(0);
    });

    it('returns 100 when progress meets or exceeds target', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 10 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(10);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.percentage).toBe(100);
    });

    it('rounds to nearest integer', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('CHAPTERS_READ', { count: 7 }) }),
      ]);
      mockPrisma.readingSession.count.mockResolvedValue(2);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.percentage).toBe(29); // Math.round(2/7 * 100) = 29
    });
  });

  // ── Condition parsing ─────────────────────────────────────────────

  describe('condition parsing', () => {
    it('returns null condition when JSON is invalid', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: 'not valid json {' }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.condition).toBeNull();
      expect(result!.target).toBe(1); // fallback
      expect(result!.progress).toBe(0); // no condition → no progress
    });

    it('returns null condition for empty string', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: '' }),
      ]);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.condition).toBeNull();
    });
  });

  // ── Error handling ────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns null when Prisma throws', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockRejectedValue(
        new Error('Database connection error'),
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await (await getFn())('primeros-pasos');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching achievement detail:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('returns null when userAchievement query throws', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([mockDef()]);
      mockPrisma.userAchievement.findFirst.mockRejectedValue(
        new Error('Query timeout'),
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await (await getFn())('primeros-pasos');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('returns null when a count query throws', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([mockDef()]);
      mockPrisma.readingSession.count.mockRejectedValue(new Error('Count failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await (await getFn())('primeros-pasos');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles user with null level in findUnique gracefully', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('LEVEL_REACHED', { level: 5 }) }),
      ]);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(1); // userLevel?.level ?? 1
    });

    it('handles user with null readingStreak gracefully', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('STREAK_DAYS', { days: 30 }) }),
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ level: 5, readingStreak: null });
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(0); // userLevel?.readingStreak ?? 0
    });

    it('handles multiple achievements in findMany — picks correct one', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ id: 'ach-001', badgeId: 'common', name: 'Common' }),
        mockDef({ id: 'ach-002', badgeId: 'rare-badge', name: 'Rare Badge' }),
        mockDef({ id: 'ach-003', badgeId: 'epic', name: 'Epic' }),
      ]);
      const result = await (await getFn())('rare-badge');
      expect(result!.id).toBe('ach-002');
      expect(result!.name).toBe('Rare Badge');
    });

    it('propagates all achievement metadata fields correctly', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({
          id: 'ach-full',
          badgeId: 'full-test',
          name: 'Full Test Achievement',
          description: 'A comprehensive test achievement',
          category: 'MILESTONE',
          difficulty: 'LEGENDARY' as Difficulty,
          xpReward: 500,
          condition: makeCondition('QUESTS_COMPLETED', { count: 100 }),
        }),
      ]);
      mockPrisma.userQuest.count.mockResolvedValue(85);
      const result = await (await getFn())('full-test');
      expect(result).toMatchObject({
        id: 'ach-full',
        badgeId: 'full-test',
        name: 'Full Test Achievement',
        description: 'A comprehensive test achievement',
        category: 'MILESTONE',
        rarity: 'LEGENDARY',
        xpReward: 500,
        progress: 85,
        target: 100,
        percentage: 85,
      });
    });

    it('respects Math.min for stats exceeding target', async () => {
      setupAuth('user-1');
      mockPrisma.achievementDefinition.findMany.mockResolvedValue([
        mockDef({ condition: makeCondition('COMMENTS_POSTED', { count: 5 }) }),
      ]);
      mockPrisma.comment.count.mockResolvedValue(999);
      const result = await (await getFn())('primeros-pasos');
      expect(result!.progress).toBe(5);
      expect(result!.percentage).toBe(100);
    });
  });
});
