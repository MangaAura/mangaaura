import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({ prisma: { chapter: { findUnique: vi.fn() } } }));

import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/chapters/[id]/route';

describe('GET /api/chapters/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns chapter data for valid ID', async () => {
    const mockChapter = {
      id: 'ch1',
      mangaId: 'm1',
      chapterNumber: 1,
      title: 'Chapter 1',
      totalPages: 20,
      pageUrls: JSON.stringify(['p1.jpg', 'p2.jpg']),
      viewCount: 100,
      isCrowdfunded: false,
      crowdfundingGoal: null,
      crowdfundingCurrent: null,
      createdAt: new Date('2025-01-01'),
      manga: { id: 'm1', title: 'Manga', slug: 'manga-slug', coverUrl: 'c.jpg', authorName: 'Author' },
    };
    vi.mocked(prisma.chapter.findUnique).mockResolvedValue(mockChapter as any);

    const req = new NextRequest('http://localhost/api/chapters/ch1');
    const params = Promise.resolve({ id: 'ch1' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('ch1');
    expect(data.pageUrls).toEqual(['p1.jpg', 'p2.jpg']);
    expect(data.manga.title).toBe('Manga');
  });

  it('returns 404 when chapter not found', async () => {
    vi.mocked(prisma.chapter.findUnique).mockResolvedValue(null as any);

    const req = new NextRequest('http://localhost/api/chapters/unknown');
    const params = Promise.resolve({ id: 'unknown' });
    const response = await GET(req, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Capítulo no encontrado');
  });

  it('returns 500 on server error', async () => {
    vi.mocked(prisma.chapter.findUnique).mockRejectedValue(new Error('DB error'));

    const req = new NextRequest('http://localhost/api/chapters/ch1');
    const params = Promise.resolve({ id: 'ch1' });
    const response = await GET(req, { params });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Error interno del servidor');
  });
});
