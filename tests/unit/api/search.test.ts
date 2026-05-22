import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRateLimit = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());
const mockWithCache = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getRateLimitKey: vi.fn(() => 'ratelimit:search:test'),
}));

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
  generateCacheKey: vi.fn(() => 'mangaaura:search:mangas:test'),
  cacheConfig: { manga: { list: { ttl: 300 } } },
}));

import { GET } from '@/app/api/search/route';

const mangaFixture = {
  id: 'manga-1',
  title: 'Test Manga',
  slug: 'test-manga',
  description: 'A test manga description',
  coverUrl: '/covers/test.jpg',
  authorId: 'author-1',
  authorName: 'Test Author',
  status: 'ONGOING',
  tags: JSON.stringify(['action', 'adventure']),
  totalViews: 1500,
  rating: 4.5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
  _count: { chapters: 10 },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 });
    mockWithCache.mockImplementation((_key: string, _ttl: number, fetchFn: () => unknown) => fetchFn());
  });

  it('returns search results for a query', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    const response = await GET(createRequest('/api/search?q=test'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].title).toBe('Test Manga');
    expect(data.pagination.total).toBe(1);
  });

  it('returns empty results when no query matches', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const response = await GET(createRequest('/api/search?q=nonexistent'));
    const data = await response.json();

    expect(data.results).toHaveLength(0);
    expect(data.pagination.total).toBe(0);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const response = await GET(createRequest('/api/search?q=test'));

    expect(response.status).toBe(429);
  });

  it('returns 500 on internal error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/search?q=test'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });

  it('applies genre filter when provided', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/search?genres[]=action'));

    expect(mockFindMany).toHaveBeenCalled();
  });

  it('applies status filter when provided', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/search?status=COMPLETED'));

    expect(mockFindMany).toHaveBeenCalled();
  });

  it('applies sort parameter', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    await GET(createRequest('/api/search?sort=rating'));

    expect(mockFindMany).toHaveBeenCalled();
  });

  it('uses pagination defaults when not specified', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await GET(createRequest('/api/search'));

    expect(mockFindMany).toHaveBeenCalled();
  });

  it('returns pagination metadata', async () => {
    mockFindMany.mockResolvedValue([mangaFixture]);
    mockCount.mockResolvedValue(1);

    const response = await GET(createRequest('/api/search?q=test'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      nextCursor: null,
    });
  });
});
