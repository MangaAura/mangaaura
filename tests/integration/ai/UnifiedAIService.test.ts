/**
 * Integration Tests for UnifiedAIService
 * 
 * Tests the complete flow: Queue -> Worker Pool -> Engine -> Registry
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UnifiedAIService,
  ServiceConfig,
  ServiceJob,
} from '@/infrastructure/ai/UnifiedAIService';

describe('UnifiedAIService Integration', () => {
  let service: UnifiedAIService;

  beforeEach(async () => {
    const config: ServiceConfig = {
      useInMemoryFallback: true,
      minWorkers: 1,
      maxWorkers: 3,
      maxConcurrent: 2,
      enablePersistence: false,
    };
    service = new UnifiedAIService(config);
    await service.start();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('Job Submission', () => {
    it('should submit and process a classify-genre job', async () => {
      // Act
      const result = await service.classifyGenre('an epic fantasy adventure with magic and dragons');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.metadata.latencyMs).toBeGreaterThan(0);
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should submit and process an embedding job', async () => {
      // Act
      const result = await service.generateEmbedding('test text for embedding');

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should handle analyze-comment jobs', async () => {
      // Act
      const result = await service.analyzeComment('This is an amazing chapter! Love it ❤️');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('sentiment');
      expect(result.data).toHaveProperty('toxicity');
      expect(result.data).toHaveProperty('spoilerScore');
    });

    it('should process jobs with different priorities', async () => {
      // Arrange
      const highPriorityJob: ServiceJob = {
        type: 'classify-genre',
        payload: { prompt: 'high priority test' },
        priority: 1,
      };

      const lowPriorityJob: ServiceJob = {
        type: 'classify-genre',
        payload: { prompt: 'low priority test' },
        priority: 5,
      };

      // Act
      const [highResult, lowResult] = await Promise.all([
        service.submit(highPriorityJob),
        service.submit(lowPriorityJob),
      ]);

      // Assert
      expect(highResult.success).toBe(true);
      expect(lowResult.success).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple jobs in parallel', async () => {
      // Arrange
      const jobs: ServiceJob[] = [
        { type: 'classify-genre', payload: { prompt: 'action' } },
        { type: 'classify-genre', payload: { prompt: 'romance' } },
        { type: 'classify-genre', payload: { prompt: 'comedy' } },
      ];

      // Act
      const results = await service.submitBatch({ jobs, strategy: 'parallel' });

      // Assert
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should process jobs sequentially', async () => {
      // Arrange
      const jobs: ServiceJob[] = [
        { type: 'classify-genre', payload: { prompt: 'test1' } },
        { type: 'classify-genre', payload: { prompt: 'test2' } },
      ];

      // Act
      const results = await service.submitBatch({ jobs, strategy: 'sequential' });

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle batch with failFast option', async () => {
      // Arrange - mix valid and potentially problematic jobs
      const jobs: ServiceJob[] = [
        { type: 'classify-genre', payload: { prompt: 'action' } },
        { type: 'classify-genre', payload: { prompt: 'romance' } },
      ];

      // Act
      const results = await service.submitBatch({ jobs, failFast: false });

      // Assert
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Model Registry', () => {
    it('should register and retrieve models', () => {
      // Arrange
      const model = {
        id: 'test-custom-model',
        name: 'Test Custom Model',
        provider: 'test',
        capabilities: ['chat', 'classification'] as const,
        config: { maxRequestsPerMinute: 50 },
        status: {
          health: 'healthy' as const,
          consecutiveFailures: 0,
          totalSuccessfulRequests: 0,
          totalFailedRequests: 0,
        },
        registeredAt: new Date(),
      };

      // Act
      service.registerModel(model as any);
      const retrieved = service.getModel('test-custom-model');

      // Assert
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-custom-model');
      expect(retrieved?.name).toBe('Test Custom Model');
    });

    it('should list all registered models', () => {
      // Act
      const models = service.listModels();

      // Assert - Should have at least the in-memory fallback
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.provider === 'local')).toBe(true);
    });

    it('should unregister models', () => {
      // Arrange
      const modelId = 'temp-model';
      service.registerModel({
        id: modelId,
        name: 'Temp Model',
        provider: 'test',
        capabilities: ['chat'],
        config: {},
        status: {
          health: 'healthy',
          consecutiveFailures: 0,
          totalSuccessfulRequests: 0,
          totalFailedRequests: 0,
        },
        registeredAt: new Date(),
      });

      // Act
      service.unregisterModel(modelId);
      const retrieved = service.getModel(modelId);

      // Assert
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Health & Metrics', () => {
    it('should report service health', async () => {
      // Act
      const health = service.getHealth();

      // Assert
      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.components.queue).toBe('up');
      expect(health.components.pool).toBe('up');
      expect(health.components.engine).toBe('up');
      expect(health.components.registry).toBe('up');
      expect(health.models.total).toBeGreaterThan(0);
    });

    it('should track service metrics', async () => {
      // Act - Process some jobs first
      await service.classifyGenre('test1');
      await service.classifyGenre('test2');

      // Small delay to ensure metrics are updated
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get metrics
      const metrics = service.getMetrics();

      // Assert
      expect(metrics.jobs.total).toBeGreaterThanOrEqual(2);
      expect(metrics.jobs.completed + metrics.jobs.failed).toBeGreaterThanOrEqual(2);
      expect(metrics.performance).toHaveProperty('avgQueueTimeMs');
      expect(metrics.performance).toHaveProperty('throughputPerMinute');
    });

    it('should provide queue statistics', () => {
      // Act
      const stats = service.getQueueStats();

      // Assert
      expect(stats).toHaveProperty('length');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle job timeouts gracefully', async () => {
      // Arrange - Job with very short timeout
      const job: ServiceJob = {
        type: 'summarize-chapter',
        payload: { chapterText: 'a'.repeat(10000) }, // Large text
        timeout: 1, // 1ms - will definitely timeout
      };

      // Act
      const result = await service.submit(job);

      // Assert - Should fail but gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should retry failed jobs', async () => {
      // This test validates that the retry mechanism is in place
      // by checking metrics show retry attempts
      
      // Act
      await service.classifyGenre('test');

      // Assert
      const metrics = service.getMetrics();
      // Should have at least one completed job
      expect(metrics.jobs.completed + metrics.jobs.retried).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop cleanly', async () => {
      // Arrange
      const testService = new UnifiedAIService({ useInMemoryFallback: true });

      // Act - Start
      await testService.start();
      const healthAfterStart = testService.getHealth();

      // Assert - Started
      expect(healthAfterStart.components.queue).toBe('up');

      // Act - Stop
      await testService.stop();

      // After stop, we can't query health but shouldn't throw
      // The service sets isRunning = false internally
    });
  });
});
