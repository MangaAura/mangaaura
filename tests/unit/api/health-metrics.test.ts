import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  prisma: { $queryRaw: vi.fn() },
}));

const mockRedisStatus = vi.hoisted(() => ({
  getRedisStatus: vi.fn(),
}));

vi.mock('@/lib/prisma', () => mockPrisma);
vi.mock('@/lib/redis', () => mockRedisStatus);

import { GET } from '@/app/api/health/metrics/route';

describe('GET /api/health/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with text/plain content type', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain');
  });

  it('includes expected Prometheus metric names', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('mangaaura_build_info');
    expect(text).toContain('mangaaura_uptime_seconds');
    expect(text).toContain('mangaaura_start_time_seconds');
    expect(text).toContain('mangaaura_memory_bytes');
    expect(text).toContain('mangaaura_database_up');
    expect(text).toContain('mangaaura_database_latency_ms');
    expect(text).toContain('mangaaura_redis_up');
    expect(text).toContain('mangaaura_redis_mode');
    expect(text).toContain('# EOF');
  });

  it('reports database as down when query fails', async () => {
    mockPrisma.prisma.$queryRaw.mockRejectedValue(new Error('DB down'));
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('mangaaura_database_up 0');
  });

  it('reports redis as down when disconnected', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: false, isMock: false, mode: 'disconnected' });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('mangaaura_redis_up 0');
    expect(text).toContain('mangaaura_redis_mode{mode="disconnected"} 1');
  });

  it('sets Cache-Control: no-store header', async () => {
    mockPrisma.prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockRedisStatus.getRedisStatus.mockResolvedValue({ connected: true, isMock: false, mode: 'connected' });

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });
});
