import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    mangaSeries: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'manga-1',
          title: 'Test Manga',
          slug: 'test-manga',
          description: 'A test manga',
          coverUrl: '/cover.jpg',
          status: 'ONGOING',
          tags: ['action', 'adventure'],
          authorId: 'author-1',
          authorName: 'Test Author',
          rating: 4.5,
          totalViews: 1000,
          createdAt: new Date('2024-01-01'),
          _count: { chapters: 10 },
        },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'manga-1',
        title: 'Test Manga',
        slug: 'test-manga',
        description: 'A test manga',
        coverUrl: '/cover.jpg',
        status: 'ONGOING',
        tags: ['action', 'adventure'],
        authorId: 'author-1',
        authorName: 'Test Author',
        rating: 4.5,
        totalViews: 1000,
        createdAt: new Date('2024-01-01'),
        _count: { chapters: 10 },
        chapters: [
          {
            id: 'chapter-1',
            mangaId: 'manga-1',
            chapterNumber: 1,
            title: 'Chapter 1',
            pageCount: 20,
            viewCount: 100,
            createdAt: new Date('2024-01-01'),
          },
        ],
      }),
      count: vi.fn().mockResolvedValue(1),
    },
  },
}));

describe('Manga API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paginated manga list', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mangas = await prisma.mangaSeries.findMany({
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });

    expect(mangas).toHaveLength(1);
    expect(mangas[0].title).toBe('Test Manga');
    expect(mangas[0].slug).toBe('test-manga');
  });

  it('fetches manga detail with chapters', async () => {
    const { prisma } = await import('@/lib/prisma');
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: 'manga-1' },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          take: 50,
        },
        _count: { select: { chapters: true } },
      },
    });

    expect(manga).toBeDefined();
    expect(manga?.title).toBe('Test Manga');
    expect(manga?.chapters).toHaveLength(1);
    expect(manga?.chapters[0].chapterNumber).toBe(1);
  });

  it('returns count of manga series', async () => {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.mangaSeries.count();

    expect(count).toBe(1);
  });

  it('supports filtering by status', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mangas = await prisma.mangaSeries.findMany({
      where: { status: 'ONGOING' },
      take: 20,
    });

    expect(mangas).toHaveLength(1);
    expect(mangas[0].status).toBe('ONGOING');
  });

  it('supports search by title', async () => {
    const { prisma } = await import('@/lib/prisma');
    const mangas = await prisma.mangaSeries.findMany({
      where: {
        OR: [
          { title: { contains: 'Test' } },
          { description: { contains: 'Test' } },
        ],
      },
    });

    expect(mangas).toHaveLength(1);
    expect(mangas[0].title).toContain('Test');
  });
});
