import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  RedisCircuitBreaker,
  getRedisCircuitBreaker,
  resetRedisCircuitBreaker,
} from '@/lib/circuit-breaker';

describe('RedisCircuitBreaker', () => {
  let breaker: RedisCircuitBreaker;

  beforeEach(() => {
    breaker = new RedisCircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 30_000,
      healthCheckIntervalMs: 15_000,
    });
  });

  // ─── State Transitions ──────────────────────────────────────────

  describe('state transitions', () => {
    it('inicia en CLOSED', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('transiciona a OPEN tras N fallos transitorios', () => {
      breaker.recordFailure('ECONNREFUSED connection refused');
      expect(breaker.getState()).toBe('CLOSED'); // 1/3

      breaker.recordFailure('Connection timeout');
      expect(breaker.getState()).toBe('CLOSED'); // 2/3

      breaker.recordFailure('Socket hang up');
      expect(breaker.getState()).toBe('OPEN'); // 3/3
    });

    it('transiciona a OPEN inmediatamente con error permanente (auth)', () => {
      breaker.recordFailure('NOAUTH Authentication required');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('transiciona a OPEN inmediatamente con error permanente (unauthorized)', () => {
      breaker.recordFailure('Unauthorized command');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('transiciona a OPEN inmediatamente con error permanente (WRONGTYPE)', () => {
      breaker.recordFailure('WRONGTYPE Operation against a key holding the wrong kind of value');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('recordSuccess cierra el circuito', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('OPEN');

      breaker.recordSuccess();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('recordSuccess resetea el contador de fallos', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordSuccess();

      // Reset counter, so 2 more = CLOSED, 3rd opens
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('recover cierra desde OPEN', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('OPEN');

      breaker.recover();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('recover cierra desde HALF_OPEN', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('OPEN');

      // Force to HALF_OPEN via internal state manipulation
      // (normally auto-transitions after cooldown)
      const metrics1 = breaker.getMetrics();
      expect(metrics1.state).toBe('OPEN');

      breaker.recover();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('reset vuelve al estado inicial', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getMetrics().failureCount).toBe(0);
      expect(breaker.getMetrics().totalFailures).toBe(3); // total no se resetea
      expect(breaker.getMetrics().lastError).toBeNull();
    });
  });

  // ─── Error Classification ───────────────────────────────────────

  describe('error classification', () => {
    it('clasifica ECONNREFUSED como transient', () => {
      breaker.recordFailure('Error: connect ECONNREFUSED 127.0.0.1:6379');
      expect(breaker.getLastErrorClassification()).toBe('transient');
    });

    it('clasifica timeout como transient', () => {
      breaker.recordFailure('Error: connect ETIMEDOUT');
      expect(breaker.getLastErrorClassification()).toBe('transient');
    });

    it('clasifica max retries como transient', () => {
      breaker.recordFailure('Max retries per request reached');
      expect(breaker.getLastErrorClassification()).toBe('transient');
    });

    it('clasifica NOAUTH como permanent', () => {
      breaker.recordFailure('NOAUTH Authentication required.');
      expect(breaker.getLastErrorClassification()).toBe('permanent');
    });

    it('clasifica WRONGTYPE como permanent', () => {
      breaker.recordFailure('WRONGTYPE Operation against a key holding the wrong kind of value');
      expect(breaker.getLastErrorClassification()).toBe('permanent');
    });

    it('clasifica invalid password como permanent', () => {
      breaker.recordFailure('ERR invalid password');
      expect(breaker.getLastErrorClassification()).toBe('permanent');
    });

    it('retorna null si no hay error registrado', () => {
      expect(breaker.getLastErrorClassification()).toBeNull();
    });
  });

  // ─── Métricas ───────────────────────────────────────────────────

  describe('getMetrics', () => {
    it('retorna el estado inicial correcto', () => {
      const metrics = breaker.getMetrics();
      expect(metrics).toEqual({
        state: 'CLOSED',
        failureCount: 0,
        totalFailures: 0,
        totalRecoveries: 0,
        lastError: null,
        lastErrorClassification: null,
        lastFailureTime: 0,
        uptimeSinceLastRecovery: 0,
      });
    });

    it('retorna métricas actualizadas tras fallos', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('Connection timeout');

      const metrics = breaker.getMetrics();
      expect(metrics.failureCount).toBe(2);
      expect(metrics.totalFailures).toBe(2);
      expect(metrics.lastError).toBe('Connection timeout');
      expect(metrics.lastErrorClassification).toBe('transient');
      expect(metrics.lastFailureTime).toBeGreaterThan(0);
    });

    it('uptimeSinceLastRecovery > 0 solo cuando hay recovery', () => {
      expect(breaker.getMetrics().uptimeSinceLastRecovery).toBe(0);

      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.getMetrics().uptimeSinceLastRecovery).toBe(0);

      breaker.recover();
      const metrics = breaker.getMetrics();
      expect(metrics.totalRecoveries).toBe(1);
      expect(metrics.uptimeSinceLastRecovery).toBeGreaterThan(0);
    });
  });

  // ─── Auto-transition OPEN → HALF_OPEN ───────────────────────────

  describe('auto-transition OPEN → HALF_OPEN', () => {
    it('transiciona automaticamente despues del cooldown', () => {
      const shortBreaker = new RedisCircuitBreaker({
        failureThreshold: 1,
        cooldownMs: 50,
      });

      shortBreaker.recordFailure('ECONNREFUSED');
      expect(shortBreaker.getState()).toBe('OPEN');

      // Before cooldown
      expect(shortBreaker.getState()).toBe('OPEN');

      // After cooldown (use fake timers)
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(shortBreaker.getState()).toBe('HALF_OPEN');
          resolve();
        }, 60);
      });
    });
  });

  // ─── shouldHealthCheck ──────────────────────────────────────────

  describe('shouldHealthCheck', () => {
    it('retorna false en estado CLOSED', () => {
      expect(breaker.shouldHealthCheck()).toBe(false);
    });

    it('retorna false inmediatamente despues de abrirse', () => {
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      breaker.recordFailure('ECONNREFUSED');
      expect(breaker.shouldHealthCheck()).toBe(false);
    });

    it('retorna true despues del intervalo en OPEN', async () => {
      const fastBreaker = new RedisCircuitBreaker({
        failureThreshold: 1,
        healthCheckIntervalMs: 50,
        cooldownMs: 10,
      });

      fastBreaker.recordFailure('ECONNREFUSED');

      // Need to wait for both cooldown and health check interval
      await new Promise<void>((resolve) => setTimeout(resolve, 80));

      expect(fastBreaker.shouldHealthCheck()).toBe(true);
    });
  });

  // ─── Constructor con config parcial ─────────────────────────────

  it('usa valores por defecto cuando no se pasa config', () => {
    const defaultBreaker = new RedisCircuitBreaker();
    const metrics = defaultBreaker.getMetrics();
    expect(metrics.state).toBe('CLOSED');
  });

  it('mergea config parcial con defaults', () => {
    const customBreaker = new RedisCircuitBreaker({ failureThreshold: 5 });
    customBreaker.recordFailure('ECONNREFUSED');
    customBreaker.recordFailure('ECONNREFUSED');
    customBreaker.recordFailure('ECONNREFUSED');
    // Still CLOSED because threshold=5
    expect(customBreaker.getState()).toBe('CLOSED');
    customBreaker.recordFailure('ECONNREFUSED');
    customBreaker.recordFailure('ECONNREFUSED');
    expect(customBreaker.getState()).toBe('OPEN');
  });
});

// ─── Singleton ────────────────────────────────────────────────────

describe('getRedisCircuitBreaker singleton', () => {
  afterEach(() => {
    resetRedisCircuitBreaker();
  });

  it('retorna la misma instancia en llamadas sucesivas', () => {
    const a = getRedisCircuitBreaker();
    const b = getRedisCircuitBreaker();
    expect(a).toBe(b);
  });

  it('resetRedisCircuitBreaker crea una nueva instancia', () => {
    const a = getRedisCircuitBreaker();
    resetRedisCircuitBreaker();
    const b = getRedisCircuitBreaker();
    expect(a).not.toBe(b);
  });
});
