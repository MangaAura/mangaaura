import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());

const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockUserCount = vi.hoisted(() => vi.fn());
const mockMangaCount = vi.hoisted(() => vi.fn());
const mockChapterCount = vi.hoisted(() => vi.fn());
const mockCommentCount = vi.hoisted(() => vi.fn());
const mockUserActivityCount = vi.hoisted(() => vi.fn());
const mockChapterCorrectionCount = vi.hoisted(() => vi.fn());
const mockAnalyticsEventCount = vi.hoisted(() => vi.fn());
const mockMangaFindMany = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique, count: mockUserCount },
    mangaSeries: { count: mockMangaCount, findMany: mockMangaFindMany },
    chapter: { count: mockChapterCount },
    comment: { count: mockCommentCount },
    userActivity: { count: mockUserActivityCount },
    chapterCorrection: { count: mockChapterCorrectionCount },
    analyticsEvent: { count: mockAnalyticsEventCount },
  },
}));

import { GET } from '@/app/api/admin/stats/route';

const adminSession = { user: { id: 'admin-1' } };
const userSession = { user: { id: 'user-1' } };

const popularMangaFixture = {
  id: 'manga-1',
  title: 'Popular Manga',
  slug: 'popular-manga',
  coverUrl: '/covers/popular.jpg',
  authorName: 'Author',
  totalViews: 5000,
  rating: 4.8,
  _count: { chapters: 25 },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN' });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/admin/stats'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns stats for admin user', async () => {
    mockUserCount.mockResolvedValue(100);
    mockMangaCount.mockResolvedValue(50);
    mockChapterCount.mockResolvedValue(500);
    mockCommentCount.mockResolvedValue(200);
    mockUserActivityCount.mockResolvedValue(10);
    mockChapterCorrectionCount.mockResolvedValue(3);
    mockAnalyticsEventCount.mockResolvedValue(5);
    mockMangaFindMany.mockResolvedValue([popularMangaFixture]);

    const response = await GET(createRequest('/api/admin/stats'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.counts).toEqual({
      totalUsers: 100,
      totalMangas: 50,
      totalChapters: 500,
      totalComments: 200,
    });
    expect(data.activity).toEqual({
      last24h: 10,
      last7d: 10,
      last30d: 10,
    });
    expect(data.moderation).toEqual({
      pendingCorrections: 3,
      flaggedComments: 200,
      reportedContent: 5,
    });
    expect(data.popularMangas).toHaveLength(1);
    expect(data.popularMangas[0].title).toBe('Popular Manga');
    expect(data.popularMangas[0].chapterCount).toBe(25);
  });

  it('returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue(userSession);
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });

    const response = await GET(createRequest('/api/admin/stats'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Acceso denegado');
  });

  it('returns 500 on internal error', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN' });
    mockUserCount.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/admin/stats'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
