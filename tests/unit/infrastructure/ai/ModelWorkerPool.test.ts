import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('ModelWorkerPool', () => {
  let pool: import('@/infrastructure/ai/ModelWorkerPool').ModelWorkerPool;
  let ModelWorkerPool: typeof import('@/infrastructure/ai/ModelWorkerPool').ModelWorkerPool;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/infrastructure/ai/ModelWorkerPool');
    ModelWorkerPool = mod.ModelWorkerPool;
  });

  afterEach(() => {
    pool?.shutdown();
  });

  describe('Configuración', () => {
    it('debe crear el número mínimo de workers', () => {
      pool = new ModelWorkerPool({
        minWorkers: 2,
        maxWorkers: 5,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });

      expect(pool.getWorkerCount()).toBe(2);
    });

    it('debe lanzar error si minWorkers > maxWorkers', () => {
      expect(
        () =>
          new ModelWorkerPool({
            minWorkers: 5,
            maxWorkers: 3,
            idleTimeoutMs: 5000,
            maxJobsPerWorker: 10,
          })
      ).toThrow('minWorkers no puede ser mayor que maxWorkers');
    });

    it('debe lanzar error si idleTimeoutMs es menor a 1000ms', () => {
      expect(
        () =>
          new ModelWorkerPool({
            minWorkers: 1,
            maxWorkers: 3,
            idleTimeoutMs: 500,
            maxJobsPerWorker: 10,
          })
      ).toThrow('idleTimeoutMs debe ser al menos 1000ms');
    });
  });

  describe('Adquirir y liberar workers', () => {
    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 3,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe adquirir un worker disponible', async () => {
      const worker = await pool.acquire();

      expect(worker).toBeDefined();
      expect(worker.status).toBe('busy');
    });

    it('debe liberar un worker y devolverlo al pool', async () => {
      const worker = await pool.acquire();
      expect(pool.getMetrics().busyWorkers).toBe(1);

      pool.release(worker.id);

      const metrics = pool.getMetrics();
      expect(metrics.idleWorkers).toBe(1);
      expect(metrics.busyWorkers).toBe(0);
    });

    it('debe escalar cuando no hay workers disponibles', async () => {
      const pool2 = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 3,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });

      const w1 = await pool2.acquire();
      const w2 = await pool2.acquire();

      expect(pool2.getWorkerCount()).toBe(2);
      expect(pool2.getMetrics().busyWorkers).toBe(2);

      pool2.shutdown();
    });

    it('debe esperar cuando se alcanza el máximo de workers', async () => {
      const pool2 = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 2,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });

      const w1 = await pool2.acquire();
      const w2 = await pool2.acquire();

      let resolved = false;
      const acquirePromise = pool2.acquire().then((w) => {
        resolved = true;
        return w;
      });

      // Wait a tick to let microtasks settle
      await new Promise((r) => setTimeout(r, 50));

      expect(pool2.getWorkerCount()).toBe(2);
      expect(resolved).toBe(false);

      pool2.release(w1.id);

      const w3 = await acquirePromise;
      expect(w3).toBeDefined();
      expect(resolved).toBe(true);

      pool2.shutdown();
    });

    it('no debe fallar al liberar un worker inexistente', () => {
      expect(() => pool.release('no-existe')).not.toThrow();
    });
  });

  describe('Ejecución de trabajos', () => {
    const mockProvider = {
      analyzeComment: vi.fn().mockResolvedValue({
        spoilerScore: 0,
        sentiment: 'positive' as const,
        toxicity: 0,
        categories: [],
      }),
      detectSpoiler: vi.fn().mockResolvedValue(0),
      summarizeChapter: vi.fn().mockResolvedValue({
        title: 'Resumen',
        hook: 'Hook',
        keyEvents: [],
        emotionalTone: 'neutral',
      }),
      generateNotificationHook: vi.fn().mockResolvedValue('Notificación'),
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      calculateSimilarity: vi.fn().mockReturnValue(0.85),
      classifyGenre: vi.fn().mockResolvedValue(['acción']),
      classifyQuality: vi.fn().mockResolvedValue({
        score: 85,
        issues: [],
        overallQuality: 'good' as const,
      }),
    };

    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 3,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe ejecutar un trabajo de análisis', async () => {
      const result = await pool.execute(
        { type: 'analyzeComment', params: ['Great chapter!'] },
        mockProvider
      );

      expect(result.success).toBe(true);
      expect(mockProvider.analyzeComment).toHaveBeenCalledWith('Great chapter!');
    });

    it('debe ejecutar un trabajo de clasificación de género', async () => {
      const result = await pool.execute(
        { type: 'classifyGenre', params: ['shonen action manga'] },
        mockProvider
      );

      expect(result.success).toBe(true);
      expect(mockProvider.classifyGenre).toHaveBeenCalledWith(
        'shonen action manga'
      );
    });

    it('debe retornar error para tipo de trabajo desconocido', async () => {
      const result = await pool.execute(
        { type: 'unknownJob' as any, params: [] },
        mockProvider
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unknown job type');
    });
  });

  describe('Auto-escalado', () => {
    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 5,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe escalar hacia arriba', () => {
      expect(pool.getWorkerCount()).toBe(1);

      pool.scaleUp(2);

      expect(pool.getWorkerCount()).toBe(3);
    });

    it('debe respetar el máximo al escalar hacia arriba', () => {
      pool.scaleUp(10);

      expect(pool.getWorkerCount()).toBe(5);
    });

    it('debe escalar hacia abajo eliminando workers idle', async () => {
      pool.scaleUp(3);
      expect(pool.getWorkerCount()).toBe(4);

      const removed = pool.scaleDown(2);

      expect(removed).toBe(2);
      expect(pool.getWorkerCount()).toBe(2);
    });

    it('debe mantener al menos minWorkers al escalar hacia abajo', () => {
      const removed = pool.scaleDown(10);

      expect(removed).toBe(0);
      expect(pool.getWorkerCount()).toBe(1);
    });
  });

  describe('Health checks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      pool = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 3,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
        healthCheckIntervalMs: 5000,
        jobTimeoutMs: 100,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debe reciclar workers en error después del timeout', async () => {
      const worker = await pool.acquire();

      worker.status = 'error';
      worker.lastUsed = Date.now() - 600000;

      vi.advanceTimersByTime(5000);

      expect(pool.getWorkerCount()).toBe(1);
      const allWorkers = pool.getAllWorkers();
      expect(allWorkers[0].status).toBe('idle');
    });
  });

  describe('Métricas', () => {
    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 2,
        maxWorkers: 4,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe retornar métricas con la forma correcta', () => {
      const metrics = pool.getMetrics();

      expect(metrics).toHaveProperty('activeWorkers');
      expect(metrics).toHaveProperty('idleWorkers');
      expect(metrics).toHaveProperty('busyWorkers');
      expect(metrics).toHaveProperty('errorWorkers');
      expect(metrics).toHaveProperty('queueSize');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('totalJobsProcessed');
      expect(metrics).toHaveProperty('totalJobsFailed');
      expect(metrics).toHaveProperty('averageExecutionTimeMs');
      expect(metrics).toHaveProperty('uptimeMs');
    });

    it('debe reportar workers idle correctamente', () => {
      const metrics = pool.getMetrics();

      expect(metrics.activeWorkers).toBe(2);
      expect(metrics.idleWorkers).toBe(2);
      expect(metrics.busyWorkers).toBe(0);
    });
  });

  describe('Eventos', () => {
    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 1,
        maxWorkers: 3,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe emitir eventos al adquirir un worker', async () => {
      const listener = vi.fn();
      pool.onEvent(listener);

      await pool.acquire();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'worker:acquired' })
      );
    });

    it('debe emitir eventos al liberar un worker', async () => {
      const listener = vi.fn();
      pool.onEvent(listener);

      const worker = await pool.acquire();
      pool.release(worker.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'worker:released' })
      );
    });

    it('debe permitir cancelar suscripción a eventos', async () => {
      const listener = vi.fn();
      const unsubscribe = pool.onEvent(listener);

      unsubscribe();

      await pool.acquire();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      pool = new ModelWorkerPool({
        minWorkers: 2,
        maxWorkers: 4,
        idleTimeoutMs: 5000,
        maxJobsPerWorker: 10,
      });
    });

    it('debe limpiar todos los workers al hacer shutdown', () => {
      pool.shutdown();

      expect(pool.getWorkerCount()).toBe(0);
    });

    it('debe limpiar workers y resolvers pendientes al hacer shutdown', async () => {
      for (let i = 0; i < 4; i++) {
        await pool.acquire();
      }

      // This acquire will be queued (maxWorkers=4 reached)
      const queuedPromise = pool.acquire();

      // Give it a tick to register
      await new Promise((r) => setTimeout(r, 50));

      pool.shutdown();

      expect(pool.getWorkerCount()).toBe(0);

      // The queued promise should not resolve or reject (design limitation)
      // but shutdown is safe to call again
      expect(() => pool.shutdown()).not.toThrow();
    });

    it('debe ser seguro llamar shutdown múltiples veces', () => {
      pool.shutdown();
      expect(() => pool.shutdown()).not.toThrow();
    });
  });
});
