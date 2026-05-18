import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());

const mockReportFindMany = vi.hoisted(() => vi.fn());
const mockReportCount = vi.hoisted(() => vi.fn());
const mockReportFindFirst = vi.hoisted(() => vi.fn());
const mockReportCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockMangaFindUnique = vi.hoisted(() => vi.fn());
const mockChapterFindUnique = vi.hoisted(() => vi.fn());
const mockCommentFindUnique = vi.hoisted(() => vi.fn());
const mockNotificationCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userReport: {
      findMany: mockReportFindMany,
      count: mockReportCount,
      findFirst: mockReportFindFirst,
      create: mockReportCreate,
    },
    user: { findUnique: mockUserFindUnique },
    mangaSeries: { findUnique: mockMangaFindUnique },
    chapter: { findUnique: mockChapterFindUnique },
    comment: { findUnique: mockCommentFindUnique },
    notification: { create: mockNotificationCreate },
  },
}));

import { GET, POST } from '@/app/api/reports/route';

const mockSession = { user: { id: 'user-1', role: 'USER' } };
const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };
const mockModSession = { user: { id: 'mod-1', role: 'MODERATOR' } };

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
  });
  if (body) {
    (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  }
  return req;
}

describe('GET /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns reports list for admin', async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockReportFindMany.mockResolvedValue([
      { id: 'report-1', reason: 'spam', status: 'PENDING', priority: 'MEDIUM', reporter: { id: 'reporter-1', username: 'user1' } },
    ]);
    mockReportCount.mockResolvedValue(1);

    const response = await GET(createRequest('http://localhost:3000/api/reports'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reports).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it('returns reports for moderator', async () => {
    mockAuth.mockResolvedValue(mockModSession);
    mockReportFindMany.mockResolvedValue([]);
    mockReportCount.mockResolvedValue(0);

    const response = await GET(createRequest('http://localhost:3000/api/reports'));
    expect(response.status).toBe(200);
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('http://localhost:3000/api/reports'));
    expect(response.status).toBe(403);
  });

  it('rejects regular users', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await GET(createRequest('http://localhost:3000/api/reports'));
    expect(response.status).toBe(403);
  });

  it('filters by status and priority', async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockReportFindMany.mockResolvedValue([]);
    mockReportCount.mockResolvedValue(0);

    const response = await GET(createRequest('http://localhost:3000/api/reports?status=PENDING&priority=HIGH'));
    expect(response.status).toBe(200);
  });
});

describe('POST /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest('http://localhost:3000/api/reports', {
      targetType: 'USER',
      targetId: 'user-2',
      reason: 'spam',
    }));
    expect(response.status).toBe(401);
  });

  it('creates a report against a user', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockUserFindUnique.mockResolvedValue({ id: 'user-2' });
    mockReportFindFirst.mockResolvedValue(null);
    mockReportCreate.mockResolvedValue({
      id: 'report-1',
      reporterId: 'user-1',
      reportedUserId: 'user-2',
      reportType: 'SPAM',
      status: 'PENDING',
      priority: 'MEDIUM',
      reporter: { id: 'user-1', username: 'testuser', displayName: 'Test User' },
    });

    const response = await POST(createRequest('http://localhost:3000/api/reports', {
      targetType: 'USER',
      targetId: 'user-2',
      reason: 'spam',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.report).toBeDefined();
    expect(data.report.reportType).toBe('SPAM');
  });

  it('creates a report against a manga', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockMangaFindUnique.mockResolvedValue({ id: 'manga-1', authorId: 'author-1' });
    mockReportFindFirst.mockResolvedValue(null);
    mockReportCreate.mockResolvedValue({
      id: 'report-2',
      reporterId: 'user-1',
      reportedMangaId: 'manga-1',
      reportType: 'COPYRIGHT',
      status: 'PENDING',
      priority: 'HIGH',
      reporter: { id: 'user-1', username: 'testuser', displayName: 'Test User' },
    });

    const response = await POST(createRequest('http://localhost:3000/api/reports', {
      targetType: 'MANGA',
      targetId: 'manga-1',
      reason: 'copyright',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.report.priority).toBe('HIGH');
  });

  it('prevents self-reporting', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' });

    const response = await POST(createRequest('http://localhost:3000/api/reports', {
      targetType: 'USER',
      targetId: 'user-1',
      reason: 'spam',
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No puedes reportarte a ti mismo');
  });

  it('prevents duplicate reports within 24h', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockUserFindUnique.mockResolvedValue({ id: 'user-2' });
    mockReportFindFirst.mockResolvedValue({ id: 'existing-report' });

    const response = await POST(createRequest('http://localhost:3000/api/reports', {
      targetType: 'USER',
      targetId: 'user-2',
      reason: 'spam',
    }));
    expect(response.status).toBe(429);
  });

  it('validates required fields', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest('http://localhost:3000/api/reports', {}));
    expect(response.status).toBe(400);
  });
});
