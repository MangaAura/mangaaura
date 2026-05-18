import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockAchDefFindMany = vi.hoisted(() => vi.fn());
const mockUserAchFindMany = vi.hoisted(() => vi.fn());
const mockUserAchFindUnique = vi.hoisted(() => vi.fn());
const mockUserAchCreate = vi.hoisted(() => vi.fn());
const mockUserUpdate = vi.hoisted(() => vi.fn());
const mockTransCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockAchDefFindUnique = vi.hoisted(() => vi.fn());
const mockReadingSessionCount = vi.hoisted(() => vi.fn());
const mockCommentCount = vi.hoisted(() => vi.fn());
const mockCorrectionCount = vi.hoisted(() => vi.fn());
const mockUserMangaCount = vi.hoisted(() => vi.fn());
const mockCommentLikeCount = vi.hoisted(() => vi.fn());
const mockMangaSeriesCount = vi.hoisted(() => vi.fn());
const mockSponsorshipCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    achievementDefinition: {
      findMany: mockAchDefFindMany,
      findUnique: mockAchDefFindUnique,
    },
    userAchievement: {
      findMany: mockUserAchFindMany,
      findUnique: mockUserAchFindUnique,
      create: mockUserAchCreate,
    },
    user: {
      update: mockUserUpdate,
      findUnique: mockUserFindUnique,
    },
    transaction: {
      create: mockTransCreate,
    },
    readingSession: { count: mockReadingSessionCount },
    comment: { count: mockCommentCount },
    chapterCorrection: { count: mockCorrectionCount },
    userManga: { count: mockUserMangaCount },
    commentLike: { count: mockCommentLikeCount },
    mangaSeries: { count: mockMangaSeriesCount },
    sponsorshipBid: { count: mockSponsorshipCount },
    $transaction: vi.fn(),
  },
}));

import { GET } from '@/app/api/achievements/route';

const mockSession = { user: { id: 'user-1' } };

const achievementFixture = {
  id: 'ach-1',
  badgeId: 'first-chapter',
  name: 'First Chapter',
  description: 'Read your first chapter',
  iconUrl: '/badges/first-chapter.png',
  xpReward: 100,
  category: 'READING',
  difficulty: 'EASY',
  condition: JSON.stringify({ type: 'CHAPTERS_READ', count: 1 }),
};

const userAchievementFixture = {
  achievementId: 'ach-1',
  unlockedAt: new Date('2025-06-01'),
};

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe('GET /api/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockAchDefFindMany.mockResolvedValue([achievementFixture]);
    mockUserAchFindMany.mockResolvedValue([userAchievementFixture]);
    mockReadingSessionCount.mockResolvedValue(5);
    mockCommentCount.mockResolvedValue(3);
    mockCorrectionCount.mockResolvedValue(1);
    mockUserMangaCount.mockResolvedValue(2);
    mockCommentLikeCount.mockResolvedValue(10);
    mockMangaSeriesCount.mockResolvedValue(1);
    mockSponsorshipCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue({ level: 3 });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/achievements'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns achievements list with progress', async () => {
    const response = await GET(createRequest('/api/achievements'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.achievements).toHaveLength(1);
    expect(data.achievements[0].name).toBe('First Chapter');
    expect(data.achievements[0].unlocked).toBe(true);
    expect(data.achievements[0].progress).toBe(1);
    expect(data.achievements[0].target).toBe(1);
    expect(data.achievements[0].percentage).toBe(100);
  });

  it('returns stats summary', async () => {
    const response = await GET(createRequest('/api/achievements'));
    const data = await response.json();

    expect(data.stats).toEqual({
      total: 1,
      unlocked: 1,
      totalXPEarned: 100,
      completionPercentage: 100,
    });
  });

  it('handles locked achievements', async () => {
    mockUserAchFindMany.mockResolvedValue([]);

    const response = await GET(createRequest('/api/achievements'));
    const data = await response.json();

    expect(data.achievements[0].unlocked).toBe(false);
    expect(data.achievements[0].progress).toBe(1);
    expect(data.stats.unlocked).toBe(0);
  });

  it('returns 500 on internal error', async () => {
    mockAchDefFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/achievements'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
