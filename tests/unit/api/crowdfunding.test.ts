import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockExecute = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/infrastructure/adapters/paymentService', () => ({
  paymentService: {},
}));
vi.mock('@/application/use-cases/economy/ContributeCrowdfundingUseCase', () => ({
  ContributeCrowdfundingUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockExecute };
  }),
}));

import { POST } from '@/app/api/crowdfunding/contribute/route';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const mockSession = { user: { id: 'user-1', role: 'USER' } };

function createRequest(body: unknown): NextRequest {
  const req = new NextRequest(new URL('http://localhost:3000/api/crowdfunding/contribute'), { method: 'POST' });
  (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  return req;
}

describe('POST /api/crowdfunding/contribute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires auth', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest({ chapterId: UUID, amount: 100 }));
    expect(response.status).toBe(401);
  });

  it('contributes to crowdfunding', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockExecute.mockResolvedValue({
      success: true,
      contribution: { id: 'contrib-1', chapterId: UUID, userId: 'user-1', amount: 1000, isAnonymous: false, message: null, createdAt: new Date().toISOString() },
      newTotal: 5000,
      goalReached: false,
    });

    const response = await POST(createRequest({ chapterId: UUID, amount: 1000 }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contribution.amount).toBe(1000);
    expect(data.newTotal).toBe(5000);
    expect(data.goalReached).toBe(false);
  });

  it('validates amount (min 1)', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest({ chapterId: UUID, amount: 0 }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Datos inválidos');
  });

  it('validates amount (max 100000)', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest({ chapterId: UUID, amount: 999999 }));
    expect(response.status).toBe(400);
  });

  it('supports anonymous contribution', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockExecute.mockResolvedValue({
      success: true,
      contribution: { id: 'contrib-2', chapterId: UUID, userId: 'user-1', amount: 500, isAnonymous: true, message: 'Go go go!', createdAt: new Date().toISOString() },
      newTotal: 5500,
      goalReached: false,
    });

    const response = await POST(createRequest({ chapterId: UUID, amount: 500, isAnonymous: true, message: 'Go go go!' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.contribution.isAnonymous).toBe(true);
  });
});
