import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockSanitizeText = vi.hoisted(() => vi.fn((s: string) => s));

const mockDMCAFindMany = vi.hoisted(() => vi.fn());
const mockDMCACount = vi.hoisted(() => vi.fn());
const mockDMCACreate = vi.hoisted(() => vi.fn());
const mockDMCAGroupBy = vi.hoisted(() => vi.fn());
const mockMangaFindUnique = vi.hoisted(() => vi.fn());
const mockChapterFindUnique = vi.hoisted(() => vi.fn());
const mockUserFindMany = vi.hoisted(() => vi.fn());
const mockNotificationCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/sanitize', () => ({ sanitizeText: mockSanitizeText }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dMCATakedown: {
      count: mockDMCACount,
      findMany: mockDMCAFindMany,
      create: mockDMCACreate,
      groupBy: mockDMCAGroupBy,
    },
    mangaSeries: { findUnique: mockMangaFindUnique },
    chapter: { findUnique: mockChapterFindUnique },
    user: { findMany: mockUserFindMany },
    notification: { create: mockNotificationCreate },
  },
}));

import { GET, POST } from '@/app/api/dmca/route';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };
const mockUserSession = { user: { id: 'user-1', role: 'USER' } };

const validPayload = {
  requesterName: 'John Doe',
  requesterEmail: 'john@example.com',
  requesterAddress: '123 Main Street, City, Country 12345',
  infringingMangaId: UUID,
  originalWorkUrl: 'https://original.com/work',
  originalWorkDescription: 'This is my original copyrighted work that has been infringed upon.',
  goodFaithStatement: true,
  signature: 'John Doe',
};

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
    headers: { 'x-forwarded-for': '127.0.0.1' },
  });
  if (body) {
    (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  }
  return req;
}

describe('POST /api/dmca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits DMCA takedown', async () => {
    mockDMCACount.mockResolvedValue(0);
    mockMangaFindUnique.mockResolvedValue({ id: UUID, title: 'Infringing Manga' });
    mockUserFindMany.mockResolvedValue([{ id: 'admin-1' }]);
    mockDMCACreate.mockResolvedValue({ id: 'dmca-1', status: 'PENDING', submittedAt: new Date() });

    const response = await POST(createRequest('http://localhost:3000/api/dmca', validPayload));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.dmca.status).toBe('PENDING');
  });

  it('validates required fields', async () => {
    const response = await POST(createRequest('http://localhost:3000/api/dmca', {}));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Datos inválidos');
  });

  it('requires infringing content', async () => {
    const payload = { ...validPayload, infringingMangaId: undefined };
    const response = await POST(createRequest('http://localhost:3000/api/dmca', payload));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Debes especificar el contenido infractor (manga o capítulo)');
  });

  it('returns 404 if manga not found', async () => {
    mockDMCACount.mockResolvedValue(0);
    mockMangaFindUnique.mockResolvedValue(null);

    const response = await POST(createRequest('http://localhost:3000/api/dmca', validPayload));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Manga no encontrado');
  });

  it('rate limits to 3 per 24h per email', async () => {
    mockDMCACount.mockResolvedValue(3);

    const response = await POST(createRequest('http://localhost:3000/api/dmca', validPayload));
    expect(response.status).toBe(429);
  });
});

describe('GET /api/dmca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns DMCA status for admin', async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockDMCAFindMany.mockResolvedValue([
      { id: 'dmca-1', status: 'PENDING', requesterEmail: 'john@example.com', submittedAt: new Date() },
    ]);
    mockDMCACount.mockResolvedValue(1);
    mockDMCAGroupBy.mockResolvedValue([{ status: 'PENDING', _count: { status: 1 } }]);

    const response = await GET(createRequest('http://localhost:3000/api/dmca'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.dmcas).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it('rejects non-admin users', async () => {
    mockAuth.mockResolvedValue(mockUserSession);

    const response = await GET(createRequest('http://localhost:3000/api/dmca'));
    expect(response.status).toBe(401);
  });
});
