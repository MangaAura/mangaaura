import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const mockContactCreate = vi.hoisted(() => vi.fn());
const mockContactFindMany = vi.hoisted(() => vi.fn());
const mockContactCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getRateLimitKey: vi.fn(() => 'ratelimit:contact:test'),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create: mockContactCreate,
      findMany: mockContactFindMany,
      count: mockContactCount,
    },
  },
}));

import { GET, POST } from '@/app/api/contact/route';

const mockUserSession = { user: { id: 'user-1', role: 'USER' } };
const mockAdminSession = { user: { id: 'admin-1', role: 'ADMIN' } };

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

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 2, resetAt: Date.now() + 3600000 });
  });

  it('submits contact message', async () => {
    mockAuth.mockResolvedValue(mockUserSession);
    mockContactCreate.mockResolvedValue({ id: 'contact-1' });

    const response = await POST(createRequest('http://localhost:3000/api/contact', {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message that is long enough to pass validation.',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.id).toBe('contact-1');
  });

  it('validates required fields', async () => {
    const response = await POST(createRequest('http://localhost:3000/api/contact', {
      name: '',
      email: 'invalid',
      subject: '',
      message: 'short',
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Datos inválidos');
  });

  it('requires minimum message length (20 chars)', async () => {
    mockAuth.mockResolvedValue(mockUserSession);

    const response = await POST(createRequest('http://localhost:3000/api/contact', {
      name: 'Test',
      email: 'test@example.com',
      subject: 'Subject',
      message: 'Too short',
    }));
    expect(response.status).toBe(400);
  });

  it('rate limits to 3 per hour per IP', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 3600000 });

    const response = await POST(createRequest('http://localhost:3000/api/contact', {
      name: 'Test',
      email: 'test@example.com',
      subject: 'Subject',
      message: 'This message is long enough to pass the validation check.',
    }));
    expect(response.status).toBe(429);
  });
});

describe('GET /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires admin or moderator role', async () => {
    mockAuth.mockResolvedValue(mockUserSession);

    const response = await GET(createRequest('http://localhost:3000/api/contact'));
    expect(response.status).toBe(403);
  });

  it('returns paginated messages for admin', async () => {
    mockAuth.mockResolvedValue(mockAdminSession);
    mockContactFindMany.mockResolvedValue([
      { id: 'msg-1', name: 'Test', email: 'test@example.com', subject: 'Help', message: 'Need assistance', status: 'PENDING', createdAt: new Date() },
    ]);
    mockContactCount.mockResolvedValue(1);

    const response = await GET(createRequest('http://localhost:3000/api/contact'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messages).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });
});
