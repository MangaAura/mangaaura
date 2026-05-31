import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be hoisted above imports
const mockAuth = vi.hoisted(() => vi.fn());
const mockUserActivityFindMany = vi.hoisted(() => vi.fn());
const mockUserActivityCount = vi.hoisted(() => vi.fn());
const mockFollowFindMany = vi.hoisted(() => vi.fn());
const mockMangaFindMany = vi.hoisted(() => vi.fn());
const mockUserFindMany = vi.hoisted(() => vi.fn());
const mockClanFindMany = vi.hoisted(() => vi.fn());
const mockAchievementFindMany = vi.hoisted(() => vi.fn());
const mockCommentFindMany = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userActivity: {
      findMany: mockUserActivityFindMany,
      count: mockUserActivityCount,
    },
    follow: { findMany: mockFollowFindMany },
    mangaSeries: { findMany: mockMangaFindMany },
    user: { findMany: mockUserFindMany },
    clan: { findMany: mockClanFindMany },
    achievementDefinition: { findMany: mockAchievementFindMany },
    comment: { findMany: mockCommentFindMany },
  },
}));

import { GET } from '@/app/api/feed/route';

const mockSession = { user: { id: 'user-1' } };

const now = new Date('2025-06-01T12:00:00Z');

// Fixture matching the DB model userActivity
const activityFixture = {
  id: 'act-1',
  userId: 'user-1',
  activityType: 'READ_CHAPTER',
  referenceId: 'manga-1',
  targetType: 'MANGA',
  isPublic: true,
  metadata: JSON.stringify({ chapterNumber: 5, chapterId: 'ch-1', chapterTitle: 'Capítulo 5' }),
  createdAt: now,
};

const otherUserActivityFixture = {
  id: 'act-2',
  userId: 'user-2',
  activityType: 'READ_CHAPTER',
  referenceId: 'manga-1',
  targetType: 'MANGA',
  isPublic: true,
  metadata: JSON.stringify({ chapterNumber: 3, chapterId: 'ch-3', chapterTitle: 'Capítulo 3' }),
  createdAt: new Date('2025-06-01T11:00:00Z'),
};

const userFixture = { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null };
const otherUserFixture = { id: 'user-2', username: 'otheruser', displayName: 'Other User', avatarUrl: null };
const mangaFixture = { id: 'manga-1', title: 'Test Manga', slug: 'test-manga', coverUrl: '/covers/test.jpg' };

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockUserActivityFindMany.mockResolvedValue([activityFixture]);
    mockUserActivityCount.mockResolvedValue(1);
    mockUserFindMany.mockResolvedValue([userFixture]);
    mockMangaFindMany.mockResolvedValue([mangaFixture]);
    mockFollowFindMany.mockResolvedValue([]);
    mockClanFindMany.mockResolvedValue([]);
    mockAchievementFindMany.mockResolvedValue([]);
    mockCommentFindMany.mockResolvedValue([]);
  });

  it('returns global feed for unauthenticated user (public)', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activities).toHaveLength(1);
  });

  it('returns feed for authenticated user', async () => {
    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe('READING');
    expect(data.activities[0].user.username).toBe('testuser');
  });

  it('limits results', async () => {
    const activities = Array.from({ length: 5 }, (_, i) => ({
      ...activityFixture,
      id: `act-${i}`,
    }));
    mockUserActivityFindMany.mockResolvedValue(activities);
    mockUserActivityCount.mockResolvedValue(100);

    const response = await GET(createRequest('/api/feed?limit=5'));
    const data = await response.json();

    expect(data.activities).toHaveLength(5);
    expect(data.pagination.limit).toBe(5);
  });

  it('returns pagination metadata', async () => {
    mockUserActivityCount.mockResolvedValue(50);

    const response = await GET(createRequest('/api/feed?page=2&limit=10'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it('filters by personal type (own activities)', async () => {
    await GET(createRequest('/api/feed?type=personal'));

    expect(mockUserActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      })
    );
  });

  it('filters by following type', async () => {
    mockFollowFindMany.mockResolvedValue([
      { followingId: 'user-2', followerId: 'user-1', followingType: 'USER' },
      { followingId: 'user-3', followerId: 'user-1', followingType: 'USER' },
    ]);

    await GET(createRequest('/api/feed?type=following'));

    expect(mockUserActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: ['user-2', 'user-3', 'user-1'] },
        }),
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockUserActivityFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
