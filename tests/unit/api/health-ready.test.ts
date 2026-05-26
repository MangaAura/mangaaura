import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  prisma: { $queryRaw: vi.fn() },
}));

const mockRedisStatus = vi.hoisted(() => ({
  getRedisStatus: vi.fn(),
}));

vi.mock('@/lib/prisma', () => mockPrisma);
vi.mock('@/lib/redis', () => mockRedisStatus);

import { GET } from '@/app/api/health/ready/route';

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with ready status when db and redis are up', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ready');
    expect(data.database).toBe(true);
    expect(data.redis).toBe(true);
  });

  it('returns 503 when database is down', async () => {
    mockPrisma.prisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('not_ready');
    expect(data.database).toBe(false);
  });

  it('is ready when using mock Redis', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: false, isMock: true, mode: 'mock' });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ready');
    expect(data.redisMode).toBe('mock');
  });

  it('includes timestamp field', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('timestamp');
  });

  it('sets Cache-Control: no-store header', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });
});
