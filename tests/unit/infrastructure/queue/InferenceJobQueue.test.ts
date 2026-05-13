import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { InferenceJobQueue, resetInferenceJobQueue, getInferenceJobQueue } = await import(
  '@/infrastructure/queue/InferenceJobQueue'
);

describe('InferenceJobQueue', () => {
  let queue: InstanceType<typeof InferenceJobQueue>;

  beforeEach(() => {
    resetInferenceJobQueue();
    queue = getInferenceJobQueue();
  });

  afterEach(() => {
    queue.dispose();
  });

  describe('Operaciones básicas de la cola', () => {
    it('debe encolar trabajos con prioridad crítica primero', () => {
      queue.enqueue(
        { id: 'job-1', type: 'analyze', payload: { id: '1' } },
        InferenceJobQueue.PRIORITIES.critical
      );
      queue.enqueue(
        { id: 'job-2', type: 'generate', payload: { id: '2' } },
        InferenceJobQueue.PRIORITIES.background
      );

      const job = queue.dequeue();
      expect(job?.job.payload.id).toBe('1');
    });

    it('debe respetar FIFO para trabajos con la misma prioridad', () => {
      queue.enqueue(
        { id: 'job-a1', type: 'analyze', payload: { id: 'first' } },
        InferenceJobQueue.PRIORITIES.normal
      );
      queue.enqueue(
        { id: 'job-g1', type: 'generate', payload: { id: 'second' } },
        InferenceJobQueue.PRIORITIES.normal
      );

      expect(queue.dequeue()?.job.payload.id).toBe('first');
      expect(queue.dequeue()?.job.payload.id).toBe('second');
    });

    it('debe manejar cola vacía', () => {
      expect(queue.dequeue()).toBeNull();
      expect(queue.peek()).toBeNull();
      expect(queue.isEmpty).toBe(true);
      expect(queue.size).toBe(0);
    });

    it('debe retornar null al hacer peek en cola vacía', () => {
      expect(queue.peek()).toBeNull();
    });

    it('debe ver el siguiente trabajo sin eliminarlo', () => {
      queue.enqueue({ id: 'job-3', type: 'analyze', payload: { id: '1' } });

      const peeked = queue.peek();
      const dequeued = queue.dequeue();

      expect(peeked).toBe(dequeued);
    });
  });

  describe('Ciclo de vida del trabajo', () => {
    it('debe completar el ciclo encolar → desencolar → completar', () => {
      const jobId = queue.enqueue({ id: 'job-4', type: 'analyze', payload: { id: '1' } }, 1);
      const dequeued = queue.dequeue();

      expect(dequeued?.status).toBe('processing');
      expect(dequeued?.attempts).toBe(1);

      queue.complete(jobId, { result: 'ok' });

      const stats = queue.getStats();
      expect(stats.completed).toBe(1);
      expect(stats.processing).toBe(0);
    });

    it('debe reintentar trabajos fallidos hasta maxRetries', () => {
      const jobId = queue.enqueue({ id: 'job-5', type: 'analyze', payload: {} });

      queue.dequeue();
      const willRetry = queue.fail(jobId, 'error temporal');
      expect(willRetry).toBe(true);

      const stats = queue.getStats();
      expect(stats.length).toBe(1);
      expect(stats.failed).toBe(0);
    });

    it('debe mover a dead letter queue tras agotar reintentos', () => {
      const jobId = queue.enqueue({ id: 'job-6', type: 'analyze', payload: {} });

      queue.dequeue();
      queue.fail(jobId, 'error 1');

      queue.dequeue();
      queue.fail(jobId, 'error 2');

      queue.dequeue();
      const wentToDLQ = queue.fail(jobId, 'error 3');

      expect(wentToDLQ).toBe(false);
      expect(queue.getDeadLetterQueue().length).toBe(1);
      expect(queue.getStats().failed).toBe(1);
    });

    it('debe limpiar la dead letter queue', () => {
      const jobId = queue.enqueue({ id: 'job-7', type: 'analyze', payload: {} });

      for (let i = 0; i < 3; i++) {
        queue.dequeue();
        queue.fail(jobId, `error ${i}`);
      }

      expect(queue.getDeadLetterQueue().length).toBe(1);
      const cleared = queue.clearDeadLetterQueue();
      expect(cleared).toBe(1);
      expect(queue.getDeadLetterQueue().length).toBe(0);
    });

    it('no debe completar un trabajo inexistente', () => {
      expect(() => queue.complete('no-existe', {})).not.toThrow();
    });
  });

  describe('Eventos', () => {
    it('debe emitir evento job:added al encolar', () => {
      const handler = vi.fn();
      queue.on('job:added', handler);

      queue.enqueue({ id: 'job-8', type: 'analyze', payload: { id: '1' } });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'analyze' })
      );
    });

    it('debe emitir evento job:started al desencolar', () => {
      const handler = vi.fn();
      queue.on('job:started', handler);

      queue.enqueue({ id: 'job-9', type: 'analyze', payload: {} });
      queue.dequeue();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('debe emitir evento job:completed al completar', () => {
      const handler = vi.fn();
      queue.on('job:completed', handler);

      const jobId = queue.enqueue({ id: 'job-10', type: 'analyze', payload: {} });
      queue.dequeue();
      queue.complete(jobId);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('debe emitir evento job:failed al fallar sin reintentos', () => {
      const handler = vi.fn();
      queue.on('job:failed', handler);

      const jobId = queue.enqueue({ id: 'job-11', type: 'analyze', payload: {} });
      for (let i = 0; i < 3; i++) {
        queue.dequeue();
        queue.fail(jobId, `error ${i}`);
      }

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('debe emitir evento queue:empty al desencolar cola vacía', () => {
      const handler = vi.fn();
      queue.on('queue:empty', handler);

      queue.dequeue();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rate limiting', () => {
    it('debe permitir trabajos dentro del límite configurado', () => {
      queue.setRateLimit('analyze', { windowMs: 1000, maxRequests: 3 });

      expect(() => {
        queue.enqueue({ id: 'rl-1', type: 'analyze', payload: {} });
        queue.enqueue({ id: 'rl-2', type: 'analyze', payload: {} });
        queue.enqueue({ id: 'rl-3', type: 'analyze', payload: {} });
      }).not.toThrow();
    });

    it('debe rechazar trabajos que exceden el límite de tasa', () => {
      queue.setRateLimit('analyze', { windowMs: 1000, maxRequests: 2 });

      queue.enqueue({ id: 'rl-4', type: 'analyze', payload: {} });
      queue.enqueue({ id: 'rl-5', type: 'analyze', payload: {} });

      expect(() => queue.enqueue({ id: 'rl-6', type: 'analyze', payload: {} })).toThrow(
        'Rate limit exceeded'
      );
    });

    it('no debe aplicar rate limit si no está configurado', () => {
      for (let i = 0; i < 100; i++) {
        expect(() =>
          queue.enqueue({ id: `rl-nc-${i}`, type: 'analyze', payload: {} })
        ).not.toThrow();
      }
    });
  });

  describe('Cancelar y actualizar prioridad', () => {
    it('debe cancelar un trabajo pendiente', () => {
      const jobId = queue.enqueue({ id: 'cancel-1', type: 'analyze', payload: {} });

      const removed = queue.remove(jobId);
      expect(removed).toBe(true);
      expect(queue.size).toBe(0);
    });

    it('no debe cancelar un trabajo en procesamiento', () => {
      const jobId = queue.enqueue({ id: 'cancel-2', type: 'analyze', payload: {} });
      queue.dequeue();

      const removed = queue.remove(jobId);
      expect(removed).toBe(false);
    });

    it('debe actualizar la prioridad de un trabajo pendiente', () => {
      queue.enqueue({ id: 'bg-1', type: 'analyze', payload: {} }, InferenceJobQueue.PRIORITIES.background);
      const jobId = queue.enqueue({ id: 'high-1', type: 'analyze', payload: { id: 'high' } }, InferenceJobQueue.PRIORITIES.background);

      const updated = queue.updatePriority(jobId, InferenceJobQueue.PRIORITIES.critical);
      expect(updated).toBe(true);

      const job = queue.dequeue();
      expect(job?.job.payload.id).toBe('high');
      expect(job?.priority).toBe(InferenceJobQueue.PRIORITIES.critical);
    });
  });

  describe('Estadísticas', () => {
    it('debe retornar estadísticas correctas con cola vacía', () => {
      const stats = queue.getStats();

      expect(stats).toHaveProperty('length');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('avgWaitTime');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('byType');
      expect(stats.length).toBe(0);
    });

    it('debe reflejar trabajos encolados en las estadísticas', () => {
      queue.enqueue({ id: 'stats-1', type: 'analyze', payload: { id: '1' } }, 1);
      queue.enqueue({ id: 'stats-2', type: 'generate', payload: { id: '2' } }, 5);
      queue.enqueue({ id: 'stats-3', type: 'summarize', payload: { id: '3' } }, 3);

      const stats = queue.getStats();

      expect(stats.length).toBe(3);
      expect(stats.byPriority[1]).toBe(1);
      expect(stats.byPriority[3]).toBe(1);
      expect(stats.byPriority[5]).toBe(1);
      expect(stats.byType.analyze).toBe(1);
      expect(stats.byType.generate).toBe(1);
      expect(stats.byType.summarize).toBe(1);
    });

    it('debe obtener trabajos por estado', () => {
      const jobId = queue.enqueue({ id: 'state-1', type: 'analyze', payload: {} });
      queue.dequeue();

      const pending = queue.getJobsByStatus('pending');
      const processing = queue.getJobsByStatus('processing');
      const completed = queue.getJobsByStatus('completed');

      expect(pending).toHaveLength(0);
      expect(processing).toHaveLength(1);

      queue.complete(jobId);

      expect(queue.getJobsByStatus('completed')).toHaveLength(1);
    });
  });

  describe('Limpiar y reiniciar', () => {
    it('debe limpiar toda la cola', () => {
      queue.enqueue({ id: 'clear-1', type: 'analyze', payload: {} });
      queue.enqueue({ id: 'clear-2', type: 'generate', payload: {} });

      expect(queue.size).toBe(2);

      queue.clear();

      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);
      expect(queue.getStats().length).toBe(0);
    });

    it('debe reiniciar el singleton', () => {
      const q1 = getInferenceJobQueue();
      resetInferenceJobQueue();
      const q2 = getInferenceJobQueue();

      expect(q1).not.toBe(q2);
    });
  });
});
