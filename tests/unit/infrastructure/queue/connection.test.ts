import { describe, it, expect, vi, beforeEach } from 'vitest';

// IMPORTANT: mocks must be hoisted before all imports
const mockIsMockRedis = vi.fn();
const mockRedisCircuitBreaker = {
  getState: vi.fn(() => 'CLOSED'),
  recover: vi.fn(),
  recordFailure: vi.fn(),
};

vi.mock('@/lib/redis', () => ({
  redis: {},
  isMockRedis: () => mockIsMockRedis(),
}));

vi.mock('@/lib/circuit-breaker', () => ({
  getRedisCircuitBreaker: () => mockRedisCircuitBreaker,
}));

describe('connection.ts', () => {
  let mod: typeof import('@/infrastructure/queue/connection');

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsMockRedis.mockReturnValue(true); // default to mock mode for tests
    // Re-import after clearing mocks
    mod = await import('@/infrastructure/queue/connection');
  });

  // ─── getBullConnection ─────────────────────────────────────────

  describe('getBullConnection', () => {
    it('retorna una conexión en modo mock', () => {
      const conn = mod.getBullConnection();
      expect(conn).toBeDefined();
    });

    it('retorna la misma conexión en llamadas sucesivas', () => {
      const a = mod.getBullConnection();
      const b = mod.getBullConnection();
      expect(a).toBe(b);
    });
  });

  // ─── getConnectionMetrics ──────────────────────────────────────

  describe('getConnectionMetrics', () => {
    it('retorna métricas con isMock=true en modo mock', () => {
      mod.getBullConnection(); // init connection first
      const metrics = mod.getConnectionMetrics();
      expect(metrics).toMatchObject({
        isMock: true,
      });
    });

    it('retorna healthy=true despues de inicializar conexion mock', () => {
      mod.getBullConnection(); // init connection — sets connectionHealthy = true
      const metrics = mod.getConnectionMetrics();
      expect(metrics.healthy).toBe(true);
    });

    it('retorna lastError=null inicialmente', () => {
      mod.getBullConnection(); // init connection
      const metrics = mod.getConnectionMetrics();
      expect(metrics.lastError).toBeNull();
    });
  });

  // ─── checkRedisHealth ──────────────────────────────────────────

  describe('checkRedisHealth', () => {
    it('retorna true en modo mock', async () => {
      const healthy = await mod.checkRedisHealth();
      expect(healthy).toBe(true);
    });
  });
});
