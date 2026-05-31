import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { userLibrary: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() }, userActivity: { create: vi.fn().mockResolvedValue({}) } } }));
vi.mock('@/lib/cache', () => ({ invalidatePattern: vi.fn() }));
vi.mock('@/lib/rate-limit-middleware', () => ({ withRateLimit: vi.fn() }));

import { GET, PATCH, DELETE } from '@/app/api/library/[mangaId]/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

describe('/api/library/[mangaId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(withRateLimit).mockResolvedValue(null as any);
  });

  const mockSession = { user: { id: 'user1' } };

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const req = new NextRequest('http://localhost/api/library/m1');
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await GET(req, { params });
      expect(response.status).toBe(401);
    });

    it('returns 404 when entry not found', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.userLibrary.findUnique).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/library/m1');
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await GET(req, { params });
      expect(response.status).toBe(404);
    });

    it('returns library entry for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.userLibrary.findUnique).mockResolvedValue({
        id: 'e1',
        userId: 'user1',
        mangaId: 'm1',
        status: 'READING',
        rating: 8,
        currentChapter: 5,
        manga: {
          id: 'm1',
          title: 'Manga',
          slug: 'manga',
          coverUrl: 'c.jpg',
          status: 'ONGOING',
          chapters: [{ chapterNumber: 10 }],
        },
      } as any);
      const req = new NextRequest('http://localhost/api/library/m1');
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await GET(req, { params });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.status).toBe('READING');
      expect(data.totalChapters).toBe(10);
    });
  });

  describe('PATCH', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const req = new NextRequest('http://localhost/api/library/m1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READING' }),
      });
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await PATCH(req, { params });
      expect(response.status).toBe(401);
    });

    it('returns 200 and updates entry', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.userLibrary.findUnique).mockResolvedValue({ id: 'e1' } as any);
      vi.mocked(prisma.userLibrary.update).mockResolvedValue({
        id: 'e1',
        userId: 'user1',
        mangaId: 'm1',
        status: 'COMPLETED',
        rating: 9,
        currentChapter: 10,
        manga: { id: 'm1', title: 'Manga', slug: 'manga', coverUrl: 'c.jpg' },
      } as any);
      const req = new NextRequest('http://localhost/api/library/m1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', rating: 9 }),
      });
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await PATCH(req, { params });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.status).toBe('COMPLETED');
    });

    it('returns 400 for invalid zod input', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      const req = new NextRequest('http://localhost/api/library/m1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await PATCH(req, { params });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const req = new NextRequest('http://localhost/api/library/m1', { method: 'DELETE' });
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await DELETE(req, { params });
      expect(response.status).toBe(401);
    });

    it('returns 200 when removing from library', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.userLibrary.delete).mockResolvedValue({} as any);
      const req = new NextRequest('http://localhost/api/library/m1', { method: 'DELETE' });
      const params = Promise.resolve({ mangaId: 'm1' });
      const response = await DELETE(req, { params });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
