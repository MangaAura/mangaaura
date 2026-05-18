import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());

const mockSendTip = vi.hoisted(() => vi.fn());
const mockGetUserTipsGiven = vi.hoisted(() => vi.fn());
const mockGetUserTipsReceived = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/infrastructure/adapters/paymentService', () => ({
  paymentService: {
    sendTip: mockSendTip,
    getUserTipsGiven: mockGetUserTipsGiven,
    getUserTipsReceived: mockGetUserTipsReceived,
  },
}));

import { GET, POST } from '@/app/api/tips/route';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const mockSession = { user: { id: 'user-1', role: 'USER' } };

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
  });
  if (body) {
    (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  }
  return req;
}

describe('GET /api/tips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tips list', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const mockTips = [{ id: 'tip-1', amount: 100, chapterId: 'chapter-1' }];
    mockGetUserTipsReceived.mockResolvedValue(mockTips);

    const response = await GET(createRequest('http://localhost:3000/api/tips?type=received'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tips).toEqual(mockTips);
    expect(mockGetUserTipsReceived).toHaveBeenCalledWith('user-1', 50);
  });

  it('returns given tips when type=given', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const mockTips = [{ id: 'tip-2', amount: 50 }];
    mockGetUserTipsGiven.mockResolvedValue(mockTips);

    const response = await GET(createRequest('http://localhost:3000/api/tips?type=given'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tips).toEqual(mockTips);
    expect(mockGetUserTipsGiven).toHaveBeenCalledWith('user-1', 50);
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('http://localhost:3000/api/tips'));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

describe('POST /api/tips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest('http://localhost:3000/api/tips', { chapterId: UUID, amount: 100 }));
    expect(response.status).toBe(401);
  });

  it('sends a tip', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockSendTip.mockResolvedValue({
      tip: { id: 'tip-1', amount: 100, chapterId: UUID, fromUserId: 'user-1', toUserId: 'author-1', message: null, createdAt: new Date().toISOString() },
      newBalance: 900,
    });

    const response = await POST(createRequest('http://localhost:3000/api/tips', { chapterId: UUID, amount: 100 }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tip.amount).toBe(100);
    expect(data.newBalance).toBe(900);
  });

  it('validates input schema', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest('http://localhost:3000/api/tips', { chapterId: 'invalid', amount: -1 }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Datos inválidos');
  });
});
