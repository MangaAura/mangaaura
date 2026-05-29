import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

const mockUpdate = vi.hoisted(() => vi.fn(() => ({
  catch: vi.fn(),
})));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    mangaSeries: {
      findUnique: vi.fn(),
      update: mockUpdate,
    },
    chapter: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/apiCache', () => ({
  invalidateCache: vi.fn(),
}));

import { GET } from '@/app/api/manga/[id]/route';
import { prisma } from '@/lib/prisma';

const mangaFixture = {
  id: 'manga-1',
  title: 'Test Manga',
  slug: 'test-manga',
  description: 'A test manga description',
  coverUrl: '/covers/test.jpg',
  status: 'ONGOING',
  tags: JSON.stringify(['action', 'adventure']),
  authorId: 'author-1',
  authorName: 'Test Author',
  rating: 4.5,
  totalViews: 1000,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-06-01'),
};

const chaptersFixture = [
  {
    id: 'ch-1',
    chapterNumber: 1,
    title: 'Chapter 1',
    totalPages: 20,
    createdAt: new Date('2025-01-15'),
    viewCount: 500,
    crowdfundingGoal: null,
    crowdfundingCurrent: null,
    isCrowdfunded: false,
  },
  {
    id: 'ch-2',
    chapterNumber: 2,
    title: 'Chapter 2',
    totalPages: 22,
    createdAt: new Date('2025-02-01'),
    viewCount: 300,
    crowdfundingGoal: 1000,
    crowdfundingCurrent: 750,
    isCrowdfunded: false,
  },
];

describe('GET /api/manga/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns manga with chapters', async () => {
    vi.mocked(prisma.mangaSeries.findUnique).mockResolvedValue(mangaFixture);
    vi.mocked(prisma.chapter.findMany).mockResolvedValue(chaptersFixture as any);

    const request = new NextRequest('http://localhost:3000/api/manga/manga-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'manga-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.manga.title).toBe('Test Manga');
    expect(data.manga.tags).toEqual(['action', 'adventure']);
    expect(data.chapters).toHaveLength(2);
  });

  it('returns 404 when manga not found', async () => {
    vi.mocked(prisma.mangaSeries.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/manga/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Manga no encontrado');
  });

  it('includes crowdfunding info when available', async () => {
    vi.mocked(prisma.mangaSeries.findUnique).mockResolvedValue(mangaFixture);
    vi.mocked(prisma.chapter.findMany).mockResolvedValue(chaptersFixture as any);

    const request = new NextRequest('http://localhost:3000/api/manga/manga-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'manga-1' }) });
    const data = await response.json();

    expect(data.chapters[1].crowdfunding).toBeDefined();
    expect(data.chapters[1].crowdfunding.goal).toBe(1000);
    expect(data.chapters[1].crowdfunding.current).toBe(750);
    expect(data.chapters[1].crowdfunding.progress).toBe(75);
    expect(data.chapters[0].crowdfunding).toBeNull();
  });

  it('sets cache headers', async () => {
    vi.mocked(prisma.mangaSeries.findUnique).mockResolvedValue(mangaFixture);
    vi.mocked(prisma.chapter.findMany).mockResolvedValue(chaptersFixture as any);

    const request = new NextRequest('http://localhost:3000/api/manga/manga-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'manga-1' }) });

    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
    expect(response.headers.get('X-Cache-Tag')).toBe('manga:manga-1');
  });

  it('returns 500 on internal error', async () => {
    vi.mocked(prisma.mangaSeries.findUnique).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost:3000/api/manga/manga-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'manga-1' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});
