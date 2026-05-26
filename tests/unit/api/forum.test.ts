import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockThreadFindMany = vi.hoisted(() => vi.fn());
const mockThreadCount = vi.hoisted(() => vi.fn());
const mockCategoryFindUnique = vi.hoisted(() => vi.fn());
const mockThreadCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    forumThread: {
      findMany: mockThreadFindMany,
      count: mockThreadCount,
      create: mockThreadCreate,
    },
    forumCategory: { findUnique: mockCategoryFindUnique },
  },
}));

import { GET, POST } from '@/app/api/forum/threads/route';

const mockSession = { user: { id: 'user-1', role: 'USER' } };

const threadFixture = {
  id: 'thread-1',
  title: 'Test Thread',
  slug: 'test-thread',
  content: 'This is a test thread',
  isPinned: false,
  createdAt: new Date('2025-06-01'),
  author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null, role: 'USER' },
  category: { id: 'cat-1', name: 'General', slug: 'general', icon: '💬' },
  _count: { posts: 5 },
};

const categoryFixture = { id: 'cat-1', name: 'General', slug: 'general', icon: '💬' };

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe('GET /api/forum/threads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThreadFindMany.mockResolvedValue([threadFixture]);
    mockThreadCount.mockResolvedValue(1);
  });

  it('returns forum threads', async () => {
    const response = await GET(createRequest('/api/forum/threads'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.threads).toHaveLength(1);
    expect(data.threads[0].title).toBe('Test Thread');
    expect(data.threads[0].author.username).toBe('testuser');
    expect(data.threads[0].category.name).toBe('General');
  });

  it('filters by category slug', async () => {
    mockCategoryFindUnique.mockResolvedValue(categoryFixture);

    await GET(createRequest('/api/forum/threads?category=general'));

    expect(mockCategoryFindUnique).toHaveBeenCalledWith({
      where: { slug: 'general' },
    });
    expect(mockThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-1' }),
      })
    );
  });

  it('ignores category filter when category not found', async () => {
    mockCategoryFindUnique.mockResolvedValue(null);

    await GET(createRequest('/api/forum/threads?category=nonexistent'));

    expect(mockThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it('returns pagination metadata', async () => {
    mockThreadCount.mockResolvedValue(50);

    const response = await GET(createRequest('/api/forum/threads?page=2&limit=10'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it('orders by pinned first, then by date', async () => {
    await GET(createRequest('/api/forum/threads'));

    expect(mockThreadFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockThreadFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/forum/threads'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al obtener hilos');
  });
});

describe('POST /api/forum/threads', () => {
  const validThread = {
    title: 'New Thread',
    content: 'Thread content here',
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    tags: ['discussion', 'help'],
  };

  const createdThread = {
    id: 'thread-new',
    title: 'New Thread',
    slug: 'new-thread-' + Date.now().toString(36),
    content: 'Thread content here',
    categoryId: validThread.categoryId,
    authorId: 'user-1',
    author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null, role: 'USER' },
    category: { id: 'cat-1', name: 'General', slug: 'general' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockCategoryFindUnique.mockResolvedValue(categoryFixture);
    mockThreadCreate.mockResolvedValue(createdThread);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validThread),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('creates a forum thread', async () => {
    const response = await POST(
      createRequest('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validThread),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.thread.title).toBe('New Thread');
    expect(data.thread.author.id).toBe('user-1');
    expect(data.thread.slug).toContain('new-thread');
  });

  it('returns 400 for invalid data', async () => {
    const response = await POST(
      createRequest('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'ab' }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Datos inválidos');
  });

  it('returns 404 when category not found', async () => {
    mockCategoryFindUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validThread),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Categoría no encontrada');
  });

  it('returns 500 on internal error', async () => {
    mockThreadCreate.mockRejectedValue(new Error('DB error'));

    const response = await POST(
      createRequest('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validThread),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al crear hilo');
  });
});
