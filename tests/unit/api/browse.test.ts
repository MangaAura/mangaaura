import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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
  generateCacheKey: vi.fn(() => 'inkverse:browse:test'),
  cacheConfig: { manga: { list: { ttl: 60 } } },
}));

import { GET } from '@/app/api/browse/route';

const mangaFixture = {
  id: 'manga-1',
  title: 'Test Manga',
  slug: 'test-manga',
  description: 'A test manga',
  coverUrl: '/covers/test.jpg',
  status: 'ONGOING',
  tags: JSON.stringify(['action', 'adventure']),
  authorName: 'Test Author',
  rating: 4.5,
  totalViews: 1500,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
  _count: { chapters: 10, libraryEntries: 50 },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/browse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithCache.mockImplementation((_key: string, _ttl: number, fetchFn: () => unknown) => fetchFn());
  });

  it('returns manga list', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    const response = await GET(createRequest('/api/browse'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mangas).toHaveLength(1);
    expect(data.mangas[0].title).toBe('Test Manga');
    expect(data.mangas[0].tags).toEqual(['action', 'adventure']);
    expect(data.mangas[0].chapterCount).toBe(10);
    expect(data.mangas[0].libraryCount).toBe(50);
  });

  it('filters by genre tag', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/browse?tag=action'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { contains: 'action' } }),
      })
    );
  });

  it('searches by query', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/browse?q=Test'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it('returns 200 with empty list when no results', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const response = await GET(createRequest('/api/browse'));

    expect(response.status).toBe(200);
  });

  it('returns pagination metadata', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    const response = await GET(createRequest('/api/browse'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('applies status filter', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/browse?status=COMPLETED'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/browse'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
