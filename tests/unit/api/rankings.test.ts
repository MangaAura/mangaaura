import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockWithCache = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    mangaSeries: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

vi.mock('@/lib/apiCache', () => ({
  withCache: mockWithCache,
  generateCacheKey: vi.fn(() => 'inkverse:rankings:test'),
  cacheConfig: { manga: { list: { ttl: 60 } } },
}));

import { GET } from '@/app/api/rankings/route';

const mangaFixture = {
  id: 'manga-1',
  title: 'Test Manga',
  slug: 'test-manga',
  coverUrl: '/covers/test.jpg',
  authorName: 'Test Author',
  status: 'ONGOING',
  totalViews: 1500,
  rating: 4.5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
  _count: { chapters: 10 },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/rankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithCache.mockImplementation((_key: string, _ttl: number, fetchFn: () => unknown) => fetchFn());
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);
  });

  it('returns rankings list', async () => {
    const response = await GET(createRequest('/api/rankings'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mangas).toHaveLength(1);
    expect(data.mangas[0].title).toBe('Test Manga');
    expect(data.mangas[0].rank).toBe(1);
    expect(data.mangas[0].chapterCount).toBe(10);
    expect(data.results).toEqual(data.mangas);
  });

  it('applies type filter', async () => {
    await GET(createRequest('/api/rankings?type=rating'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ rating: { not: null } }),
      })
    );
  });

  it('applies limit parameter', async () => {
    const mangas = Array.from({ length: 5 }, (_, i) => ({
      ...mangaFixture,
      id: `manga-${i}`,
    }));
    mockFindMany.mockResolvedValue(mangas);
    mockCount.mockResolvedValue(100);

    const response = await GET(createRequest('/api/rankings?limit=5'));
    const data = await response.json();

    expect(data.mangas).toHaveLength(5);
    expect(data.pagination.limit).toBe(5);
  });

  it('applies genre filter', async () => {
    await GET(createRequest('/api/rankings?genre=action'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { contains: 'action' } }),
      })
    );
  });

  it('applies timeRange filter for trending', async () => {
    await GET(createRequest('/api/rankings?type=trending&timeRange=week'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ updatedAt: { gte: expect.any(Date) } }),
      })
    );
  });

  it('returns pagination metadata', async () => {
    mockCount.mockResolvedValue(50);

    const response = await GET(createRequest('/api/rankings?page=2&limit=10'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('applies rank calculation', async () => {
    const mangas = Array.from({ length: 3 }, (_, i) => ({
      ...mangaFixture,
      id: `manga-${i}`,
    }));
    mockFindMany.mockResolvedValue(mangas);

    const response = await GET(createRequest('/api/rankings?page=2&limit=10'));
    const data = await response.json();

    expect(data.mangas[0].rank).toBe(11);
    expect(data.mangas[2].rank).toBe(13);
  });

  it('falls back to popularity for invalid type', async () => {
    await GET(createRequest('/api/rankings?type=invalid'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { totalViews: 'desc' },
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/rankings'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch rankings');
  });
});
