import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockRateLimit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getRateLimitKey: vi.fn(() => 'ratelimit:register:test'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => 'hashed_password'),
  default: { hash: vi.fn(() => 'hashed_password') },
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 3600000 });
  });

  it('registers a new user successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: '1',
      email: 'test@test.com',
      username: 'testuser',
      displayName: null,
      avatarUrl: null,
      xpPoints: 0,
      level: 1,
      inkcoinsBalance: 50,
      createdAt: new Date(),
    } as any);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', username: 'testuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.username).toBe('testuser');
  });

  it('rejects duplicate email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', email: 'existing@test.com' } as any);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@test.com', username: 'newuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('Email ya registrado');
  });

  it('rejects duplicate username', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: '2', email: 'other@test.com', username: 'takenuser' } as any);

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unique@test.com', username: 'takenuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('Username no disponible');
  });

  it('rejects invalid email format via zod', async () => {
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', username: 'testuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects weak password', async () => {
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', username: 'testuser', password: 'weak' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 3600000 });

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', username: 'testuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('returns 500 on internal error', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', username: 'testuser', password: 'Password1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
