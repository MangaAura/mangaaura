import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockClanFindMany = vi.hoisted(() => vi.fn());
const mockClanCount = vi.hoisted(() => vi.fn());
const mockMembershipFindFirst = vi.hoisted(() => vi.fn());
const mockClanFindUnique = vi.hoisted(() => vi.fn());
const mockClanCreate = vi.hoisted(() => vi.fn());
const mockMembershipCreate = vi.hoisted(() => vi.fn());
const mockTransaction = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clan: {
      findMany: mockClanFindMany,
      count: mockClanCount,
      findUnique: mockClanFindUnique,
      create: mockClanCreate,
    },
    clanMembership: {
      findFirst: mockMembershipFindFirst,
      create: mockMembershipCreate,
    },
    $transaction: mockTransaction,
  },
}));

import { GET, POST } from '@/app/api/clans/route';

const mockSession = { user: { id: 'user-1' } };

const clanFixture = {
  id: 'clan-1',
  name: 'Test Clan',
  description: 'A test clan',
  emblemUrl: '/emblems/test.png',
  leaderId: 'user-2',
  monthlyScore: 500,
  totalScore: 5000,
  createdAt: new Date('2025-01-01'),
  _count: { members: 10 },
};

function createRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe('GET /api/clans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClanFindMany.mockResolvedValue([clanFixture]);
    mockClanCount.mockResolvedValue(1);
  });

  it('returns clans list', async () => {
    const response = await GET(createRequest('/api/clans'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clans).toHaveLength(1);
    expect(data.clans[0].name).toBe('Test Clan');
    expect(data.clans[0].memberCount).toBe(10);
    expect(data.clans[0]._count).toBeUndefined();
  });

  it('filters by search query', async () => {
    await GET(createRequest('/api/clans?search=Test'));

    expect(mockClanFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: { contains: 'Test' } }),
      })
    );
  });

  it('returns pagination metadata', async () => {
    mockClanCount.mockResolvedValue(50);

    const response = await GET(createRequest('/api/clans?page=2&limit=10'));
    const data = await response.json();

    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it('sorts by monthlyScore descending by default', async () => {
    await GET(createRequest('/api/clans'));

    expect(mockClanFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { monthlyScore: 'desc' },
      })
    );
  });

  it('returns 500 on internal error', async () => {
    mockClanFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/clans'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al cargar los clanes');
  });
});

describe('POST /api/clans', () => {
  const validClan = { name: 'New Clan', description: 'A new clan', emblemUrl: '/emblems/new.png' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockMembershipFindFirst.mockResolvedValue(null);
    mockClanFindUnique.mockResolvedValue(null);
    mockClanCreate.mockResolvedValue({ id: 'clan-new', ...validClan, leaderId: 'user-1' });
    mockMembershipCreate.mockResolvedValue({});
    mockTransaction.mockImplementation((fn: (tx: any) => unknown) => {
      const tx = {
        clan: { create: mockClanCreate },
        clanMembership: { create: mockMembershipCreate },
      };
      return fn(tx);
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validClan),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('creates a clan', async () => {
    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validClan),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.clan.name).toBe('New Clan');
    expect(data.clan.leaderId).toBe('user-1');
  });

  it('returns 400 for name too short', async () => {
    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ab' }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('El nombre debe tener al menos 3 caracteres');
  });

  it('returns 400 for name too long', async () => {
    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(51) }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('El nombre no puede exceder 50 caracteres');
  });

  it('returns 400 when user is already in a clan', async () => {
    mockMembershipFindFirst.mockResolvedValue({ id: 'membership-1', clanId: 'clan-1' });

    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validClan),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ya eres miembro de un clan');
  });

  it('returns 400 when clan name already exists', async () => {
    mockClanFindUnique.mockResolvedValue({ id: 'clan-existing', name: 'New Clan' });

    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validClan),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Ya existe un clan con ese nombre');
  });

  it('returns 500 on internal error', async () => {
    mockTransaction.mockRejectedValue(new Error('DB error'));

    const response = await POST(
      createRequest('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validClan),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al crear el clan');
  });
});
