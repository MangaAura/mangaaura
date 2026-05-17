import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockCreateCollectionExecute = vi.hoisted(() => vi.fn());
const mockGetCollectionsExecute = vi.hoisted(() => vi.fn());
const mockFindMany = vi.hoisted(() => vi.fn());
const mockCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));
vi.mock('@/application/use-cases/collections/CreateCollectionUseCase', () => ({
  CreateCollectionUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockCreateCollectionExecute };
  }),
}));
vi.mock('@/application/use-cases/collections/GetCollectionsUseCase', () => ({
  GetCollectionsUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockGetCollectionsExecute };
  }),
}));

import { GET, POST } from '@/app/api/collections/route';

const mockSession = { user: { id: 'user-1' } };

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
  });
  if (body) {
    (req as any).json = () => Promise.resolve(body);
  }
  return req;
}

const collectionFixture = {
  id: 'col-1',
  title: 'My Collection',
  description: 'A test collection',
  isPublic: true,
  createdAt: new Date(),
  user: { id: 'user-1', username: 'testuser', displayName: 'Test', avatarUrl: null },
  _count: { items: 5 },
  items: [
    {
      manga: { id: 'manga-1', title: 'Manga One', coverUrl: '/covers/one.jpg' },
    },
    {
      manga: { id: 'manga-2', title: 'Manga Two', coverUrl: '/covers/two.jpg' },
    },
  ],
};

describe('GET /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([collectionFixture]);
    mockCount.mockResolvedValue(1);
    mockAuth.mockResolvedValue(mockSession);
  });

  it('returns collections list', async () => {
    const response = await GET(createRequest('/api/collections'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collections).toHaveLength(1);
    expect(data.collections[0].name).toBe('My Collection');
    expect(data.collections[0]._count.mangas).toBe(5);
    expect(data.collections[0].previewMangas).toHaveLength(2);
  });

  it('returns pagination metadata', async () => {
    const response = await GET(createRequest('/api/collections'));
    const data = await response.json();

    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('totalPages');
  });

  it('filters by userId when provided', async () => {
    await GET(createRequest('/api/collections?userId=user-1'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      })
    );
  });

  it('filters public collections when filter=public', async () => {
    mockAuth.mockResolvedValue(null);

    await GET(createRequest('/api/collections?filter=public'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      })
    );
  });

  it('shows only public collections for unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    await GET(createRequest('/api/collections'));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/collections'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al cargar colecciones');
  });
});

describe('POST /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockCreateCollectionExecute.mockResolvedValue({
      id: 'col-new',
      title: 'New Collection',
      description: 'A new test collection',
      isPublic: true,
      itemCount: 0,
    });
  });

  it('creates a collection successfully', async () => {
    const response = await POST(
      createRequest('/api/collections', { name: 'New Collection', description: 'A new test collection' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.collection.name).toBe('New Collection');
    expect(data.collection._count.mangas).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/collections', { name: 'Test', description: 'desc' })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns 400 for empty name', async () => {
    const response = await POST(
      createRequest('/api/collections', { name: '', description: 'desc' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Datos inválidos');
  });

  it('returns 400 for name exceeding max length', async () => {
    const response = await POST(
      createRequest('/api/collections', { name: 'a'.repeat(101), description: 'desc' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Datos inválidos');
  });

  it('creates private collection when isPublic=false', async () => {
    mockCreateCollectionExecute.mockResolvedValue({
      id: 'col-private',
      title: 'Private Collection',
      description: '',
      isPublic: false,
      itemCount: 0,
    });

    const response = await POST(
      createRequest('/api/collections', { name: 'Private', isPublic: false })
    );
    const data = await response.json();

    expect(data.collection.isPublic).toBe(false);
  });

  it('returns 500 on internal error', async () => {
    mockCreateCollectionExecute.mockRejectedValue(new Error('Service error'));

    const response = await POST(
      createRequest('/api/collections', { name: 'Test Collection', description: 'desc' })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al crear colección');
  });
});
