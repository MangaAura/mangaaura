import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockActivityFindMany = vi.hoisted(() => vi.fn());
const mockActivityCount = vi.hoisted(() => vi.fn());
const mockFollowFindMany = vi.hoisted(() => vi.fn());
const mockMangaFindUnique = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    activity: {
      findMany: mockActivityFindMany,
      count: mockActivityCount,
    },
    follow: { findMany: mockFollowFindMany },
    mangaSeries: { findUnique: mockMangaFindUnique },
    user: { findUnique: mockUserFindUnique },
  },
}));

import { GET } from '@/app/api/feed/route';

const mockSession = { user: { id: 'user-1' } };

const activityFixture = {
  id: 'act-1',
  activityType: 'READ_CHAPTER',
  targetId: 'manga-1',
  targetType: 'MANGA',
  metadata: JSON.stringify({ chapterNumber: 5 }),
  userId: 'user-1',
  isPublic: true,
  createdAt: new Date('2025-06-01'),
  user: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null },
};

const mangaTargetFixture = {
  id: 'manga-1',
  title: 'Test Manga',
  coverUrl: '/covers/test.jpg',
  slug: 'test-manga',
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockActivityFindMany.mockResolvedValue([activityFixture]);
    mockActivityCount.mockResolvedValue(1);
    mockMangaFindUnique.mockResolvedValue(mangaTargetFixture);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns feed for authenticated user', async () => {
    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe('READ_CHAPTER');
    expect(data.activities[0].message).toContain('leyó el capítulo');
    expect(data.activities[0].user.username).toBe('testuser');
    expect(data.activities[0].target).toEqual(mangaTargetFixture);
  });

  it('limits results', async () => {
    const activities = Array.from({ length: 5 }, (_, i) => ({
      ...activityFixture,
      id: `act-${i}`,
    }));
    mockActivityFindMany.mockResolvedValue(activities);
    mockActivityCount.mockResolvedValue(100);

    const response = await GET(createRequest('/api/feed?limit=5'));
    const data = await response.json();

    expect(data.activities).toHaveLength(5);
    expect(data.pagination.limit).toBe(5);
  });

  it('returns pagination metadata', async () => {
    mockActivityCount.mockResolvedValue(50);

    const response = await GET(createRequest('/api/feed?page=2&limit=10'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it('filters by MINE type', async () => {
    await GET(createRequest('/api/feed?type=MINE'));

    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      })
    );
  });

  it('filters by READING type', async () => {
    mockFollowFindMany.mockResolvedValue([]);

    await GET(createRequest('/api/feed?type=READING'));

    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          activityType: { in: ['READ_CHAPTER', 'COMPLETED_MANGA'] },
        }),
      })
    );
  });

  it('filters by SOCIAL type', async () => {
    mockFollowFindMany.mockResolvedValue([
      { followingId: 'user-2' },
      { followingId: 'user-3' },
    ]);

    await GET(createRequest('/api/feed?type=SOCIAL'));

    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: ['user-2', 'user-3', 'user-1'] },
        }),
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockActivityFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/feed'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
