import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const mockExecute = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getRateLimitKey: vi.fn(() => 'ratelimit:tip:test'),
}));
vi.mock('@/infrastructure/adapters/paymentService', () => ({
  paymentService: {},
}));
vi.mock('@/application/use-cases/economy/SendTipUseCase', () => ({
  SendTipUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockExecute };
  }),
}));

import { POST } from '@/app/api/economy/tip/route';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const mockSession = { user: { id: 'user-1', role: 'USER' } };

function createRequest(body: unknown): NextRequest {
  const req = new NextRequest(new URL('http://localhost:3000/api/economy/tip'), { method: 'POST' });
  (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  return req;
}

describe('POST /api/economy/tip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3600000 });
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest({ chapterId: UUID, amount: 100 }));
    expect(response.status).toBe(401);
  });

  it('sends a tip', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockExecute.mockResolvedValue({
      success: true,
      tip: { id: 'tip-1', amount: 100, chapterId: UUID, fromUserId: 'user-1', toUserId: 'author-1', message: null, createdAt: new Date().toISOString() },
      newBalance: 900,
    });

    const response = await POST(createRequest({ chapterId: UUID, amount: 100 }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tip.amount).toBe(100);
    expect(data.newBalance).toBe(900);
  });

  it('validates amount minimum', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest({ chapterId: UUID, amount: 1 }));
    expect(response.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 3600000 });

    const response = await POST(createRequest({ chapterId: UUID, amount: 100 }));
    expect(response.status).toBe(429);
  });
});
