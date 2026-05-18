import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockEventFindMany = vi.hoisted(() => vi.fn());
const mockEventCount = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: mockEventFindMany,
      count: mockEventCount,
    },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));

import { GET } from '@/app/api/events/route';

const eventFixture = {
  id: 'event-1',
  title: 'Art Challenge',
  description: 'Draw your favorite character',
  type: 'ART_CHALLENGE',
  status: 'ACTIVE',
  basePrompt: 'Draw something',
  prize: '100 XP',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-02-01'),
  imageUrl: '/events/test.jpg',
  color: '#ff0000',
  borderColor: '#00ff00',
  createdBy: 'creator-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  creator: { id: 'creator-1', username: 'creator', displayName: 'Creator', avatarUrl: null },
  _count: { submissions: 5 },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventFindMany.mockResolvedValue([eventFixture]);
    mockEventCount.mockResolvedValue(1);
  });

  it('returns events list', async () => {
    const response = await GET(createRequest('/api/events'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].title).toBe('Art Challenge');
    expect(data.events[0].type).toBe('ART_CHALLENGE');
    expect(data.events[0]._count.submissions).toBe(5);
  });

  it('filters by type', async () => {
    await GET(createRequest('/api/events?type=SPEEDREADING'));

    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'SPEEDREADING' }),
      })
    );
  });

  it('returns 200 with pagination', async () => {
    mockEventCount.mockResolvedValue(10);

    const response = await GET(createRequest('/api/events?page=2&limit=5'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 10,
      totalPages: 2,
    });
  });

  it('includes creator info', async () => {
    const response = await GET(createRequest('/api/events'));
    const data = await response.json();

    expect(data.events[0].creator).toBeDefined();
    expect(data.events[0].creator.username).toBe('creator');
  });

  it('returns 200 with empty list', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const response = await GET(createRequest('/api/events'));

    expect(response.status).toBe(200);
  });

  it('returns 500 on internal error', async () => {
    mockEventFindMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(createRequest('/api/events'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error al obtener eventos');
  });
});
