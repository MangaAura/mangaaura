import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  prisma: { $queryRaw: vi.fn() },
}));

const mockRedisStatus = vi.hoisted(() => ({
  getRedisStatus: vi.fn(),
  isMockRedis: vi.fn(),
}));

vi.mock('@/lib/prisma', () => mockPrisma);
vi.mock('@/lib/redis', () => mockRedisStatus);
vi.mock('@/lib/socket', () => ({ getIO: vi.fn(() => null) }));
vi.mock('@/lib/socket-redis-adapter', () => ({ getOnlineClientsCount: vi.fn(() => Promise.resolve(0)) }));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with healthy status when db and redis are up', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });
    mockRedisStatus.isMockRedis.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database).toBe(true);
    expect(data.redis).toBe(true);
  });

  it('returns 503 degraded when database fails', async () => {
    mockPrisma.prisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });
    mockRedisStatus.isMockRedis.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.database).toBe(false);
    expect(data.redis).toBe(true);
  });

  it('returns 503 degraded when redis fails', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: false, isMock: false, mode: 'disconnected' });
    mockRedisStatus.isMockRedis.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.database).toBe(true);
    expect(data.redis).toBe(false);
  });

  it('includes timestamp, version, and environment', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });
    mockRedisStatus.isMockRedis.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('environment');
  });

  it('sets Cache-Control: no-store header', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });
    mockRedisStatus.isMockRedis.mockReturnValue(false);

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });
});
