import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdateMany = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDeleteMany = vi.hoisted(() => vi.fn());
const mockGetCache = vi.hoisted(() => vi.fn());
const mockSetCache = vi.hoisted(() => vi.fn());
const mockDeleteCache = vi.hoisted(() => vi.fn());
const mockGenerateCacheKey = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    readingProgress: {
      findMany: mockFindMany,
      upsert: mockUpsert,
      deleteMany: mockDeleteMany,
    },
    chapter: { findUnique: mockFindUnique },
    userLibrary: { updateMany: mockUpdateMany },
    user: { update: mockUpdate },
  },
}));

vi.mock('@/lib/cache', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  deleteCache: mockDeleteCache,
  generateCacheKey: mockGenerateCacheKey,
}));

import { GET, POST, DELETE } from '@/app/api/progress/route';

const mockSession = { user: { id: 'user-1' } };
const VALID_MANGA_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_CHAPTER_UUID = '550e8400-e29b-41d4-a716-446655440001';
const progressFixture = {
  id: 'prog-1',
  userId: 'user-1',
  mangaId: VALID_MANGA_UUID,
  chapterId: VALID_CHAPTER_UUID,
  currentPage: 15,
  percentage: 50,
  updatedAt: new Date('2025-06-01'),
  manga: { id: VALID_MANGA_UUID, title: 'Test Manga', slug: 'test-manga', coverUrl: '/covers/test.jpg' },
  chapter: { id: VALID_CHAPTER_UUID, chapterNumber: 5, title: 'Chapter 5' },
};

const chapterFixture = {
  id: VALID_CHAPTER_UUID,
  chapterNumber: 5,
  mangaId: VALID_MANGA_UUID,
  manga: { id: VALID_MANGA_UUID },
};

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe('GET /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockGetCache.mockResolvedValue(null);
    mockSetCache.mockResolvedValue(undefined);
    mockGenerateCacheKey.mockReturnValue('inkverse:progress:user-1');
    mockFindMany.mockResolvedValue([progressFixture]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/progress'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns progress for authenticated user', async () => {
    const response = await GET(createRequest('/api/progress'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toHaveLength(1);
    expect(data.progress[0].currentPage).toBe(15);
    expect(data.progress[0].manga.title).toBe('Test Manga');
  });

  it('filters by mangaId', async () => {
    await GET(createRequest(`/api/progress?mangaId=${VALID_MANGA_UUID}`));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mangaId: VALID_MANGA_UUID }),
      })
    );
  });

  it('returns cached progress when available', async () => {
    mockGetCache.mockResolvedValue(progressFixture);

    const response = await GET(createRequest('/api/progress'));
    const data = await response.json();

    expect(data.progress.updatedAt).toBe(progressFixture.updatedAt.toISOString());
    expect(data.progress.currentPage).toBe(15);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid query parameters', async () => {
    const response = await GET(createRequest('/api/progress?mangaId=not-a-uuid'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('returns 500 on internal error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/progress'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch progress');
  });
});

describe('POST /api/progress', () => {
  const validBody = {
    mangaId: VALID_MANGA_UUID,
    chapterId: VALID_CHAPTER_UUID,
    currentPage: 15,
    percentage: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockFindUnique.mockResolvedValue(chapterFixture);
    mockUpsert.mockResolvedValue({
      id: 'prog-1',
      mangaId: validBody.mangaId,
      chapterId: validBody.chapterId,
      currentPage: 15,
      percentage: 50,
      updatedAt: new Date(),
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockUpdate.mockResolvedValue({});
    mockDeleteCache.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('saves reading progress', async () => {
    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Progress saved');
    expect(data.progress.currentPage).toBe(15);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_mangaId_chapterId: {
            userId: 'user-1',
            mangaId: validBody.mangaId,
            chapterId: validBody.chapterId,
          },
        },
        create: expect.objectContaining({ currentPage: 15, percentage: 50 }),
        update: expect.objectContaining({ currentPage: 15, percentage: 50 }),
      })
    );
  });

  it('returns 400 for invalid request body', async () => {
    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: -1 }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('returns 404 when chapter not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Chapter not found');
  });

  it('returns 404 when chapter does not belong to manga', async () => {
    mockFindUnique.mockResolvedValue({
      ...chapterFixture,
      mangaId: 'other-manga-id',
    });

    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Chapter not found');
  });

  it('returns 500 on internal error', async () => {
    mockUpsert.mockRejectedValue(new Error('DB error'));

    const response = await POST(
      createRequest('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update progress');
  });
});

describe('DELETE /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockDeleteMany.mockResolvedValue({ count: 1 });
    mockDeleteCache.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(createRequest('/api/progress?mangaId=manga-1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('deletes progress by mangaId', async () => {
    const response = await DELETE(createRequest('/api/progress?mangaId=manga-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Progress deleted');
    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mangaId: 'manga-1' }),
      })
    );
  });

  it('returns 400 when no params provided', async () => {
    const response = await DELETE(createRequest('/api/progress'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Must provide mangaId or chapterId');
  });

  it('returns 500 on internal error', async () => {
    mockDeleteMany.mockRejectedValue(new Error('DB error'));

    const response = await DELETE(createRequest('/api/progress?mangaId=manga-1'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete progress');
  });
});
