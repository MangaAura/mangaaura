/**
 * Integration Tests for ParallelInferenceEngine
 * 
 * Tests the parallel execution capabilities, fallback handling,
 * and retry mechanisms.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  ParallelInferenceEngine,
  InferenceJob,
  InferenceProvider,
} from '@/infrastructure/ai/ParallelInferenceEngine';

// Mock provider for testing
class MockProvider implements InferenceProvider {
  private shouldFail = false;
  private latency = 10;

  failNext(): void {
    this.shouldFail = true;
  }

  setLatency(ms: number): void {
    this.latency = ms;
  }

  async infer(modelId: string, input: unknown): Promise<unknown> {
    await new Promise((resolve) => setTimeout(resolve, this.latency));
    
    if (this.shouldFail) {
      this.shouldFail = false;
      throw new Error(`Model ${modelId} failed`);
    }
    
    return { modelId, input, result: 'success' };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe('ParallelInferenceEngine', () => {
  let engine: ParallelInferenceEngine;
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = new MockProvider();
    engine = new ParallelInferenceEngine(
      { maxConcurrent: 3, defaultTimeout: 5000 },
      () => mockProvider
    );
  });

  describe('executeBatch', () => {
    it('should execute multiple jobs in parallel', async () => {
      // Arrange
      const jobs: InferenceJob[] = [
        { id: '1', modelId: 'model-a', input: 'input1' },
        { id: '2', modelId: 'model-a', input: 'input2' },
        { id: '3', modelId: 'model-a', input: 'input3' },
      ];

      // Act
      const results = await engine.executeBatch(jobs);

      // Assert
      expect(results).toHaveLength(3);
      expect(results.every((r) => !r.error)).toBe(true);
      expect(results.every((r) => r.output !== undefined)).toBe(true);
    });

    it('should respect priority ordering', async () => {
      // Arrange
      const executionOrder: string[] = [];
      
      const provider: InferenceProvider = {
        async infer(modelId: string, input: unknown) {
          executionOrder.push(modelId);
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { modelId, input };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1 }, // Sequential to observe order
        () => provider
      );

      const jobs: InferenceJob[] = [
        { id: '1', modelId: 'low-priority', input: '', priority: 5 },
        { id: '2', modelId: 'high-priority', input: '', priority: 1 },
        { id: '3', modelId: 'medium-priority', input: '', priority: 3 },
      ];

      // Act
      await testEngine.executeBatch(jobs);

      // Assert - Should execute in priority order
      expect(executionOrder[0]).toBe('high-priority');
      expect(executionOrder[1]).toBe('medium-priority');
      expect(executionOrder[2]).toBe('low-priority');
    });

    it('should handle mixed success and failures', async () => {
      // Arrange
      let callCount = 0;
      const provider: InferenceProvider = {
        async infer(modelId: string, input: unknown) {
          callCount++;
          if (callCount === 2) throw new Error('Simulated failure');
          return { modelId, input };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 3 },
        () => provider
      );

      const jobs: InferenceJob[] = [
        { id: '1', modelId: 'model-a', input: 'input1' },
        { id: '2', modelId: 'model-b', input: 'input2' },
        { id: '3', modelId: 'model-c', input: 'input3' },
      ];

      // Act
      const results = await testEngine.executeBatch(jobs);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[2].error).toBeUndefined();
    });

    it('should handle empty job list', async () => {
      // Act
      const results = await engine.executeBatch([]);

      // Assert
      expect(results).toEqual([]);
    });
  });

  describe('executeWithFallback', () => {
    it('should use fallback when primary fails', async () => {
      // Arrange
      const providers: Map<string, InferenceProvider> = new Map();
      
      const primaryProvider: InferenceProvider = {
        async infer() { throw new Error('Primary failed'); },
        async isAvailable() { return true; },
      };
      
      const fallbackProvider: InferenceProvider = {
        async infer(modelId: string, input: unknown) {
          return { modelId, input, source: 'fallback' };
        },
        async isAvailable() { return true; },
      };

      providers.set('primary', primaryProvider);
      providers.set('fallback', fallbackProvider);

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1 },
        (modelId) => {
          if (modelId === 'primary-model') return primaryProvider;
          if (modelId === 'fallback-1') return fallbackProvider;
          return mockProvider;
        }
      );

      const job: InferenceJob = { id: '1', modelId: 'primary-model', input: 'test' };

      // Act
      const result = await testEngine.executeWithFallback(job, ['fallback-1']);

      // Assert
      expect(result.error).toBeUndefined();
      expect(result.output).toBeDefined();
    });

    it('should fail when all models fail', async () => {
      // Arrange
      const failingProvider: InferenceProvider = {
        async infer() { throw new Error('All failed'); },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1 },
        () => failingProvider
      );

      const job: InferenceJob = { id: '1', modelId: 'model-1', input: 'test' };

      // Act
      const result = await testEngine.executeWithFallback(job, ['model-2', 'model-3']);

      // Assert
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('ALL_MODELS_FAILED');
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on recoverable errors', async () => {
      // Arrange
      let attempts = 0;
      const provider: InferenceProvider = {
        async infer() {
          attempts++;
          if (attempts < 3) {
            const error = new Error('Network error');
            // Add code property properly
            Object.defineProperty(error, 'code', {
              value: 'NETWORK_ERROR',
              writable: false,
              enumerable: true,
              configurable: true
            });
            throw error;
          }
          return { success: true };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1, maxRetries: 3, initialBackoffMs: 10 },
        () => provider
      );

      const job: InferenceJob = { id: '1', modelId: 'test', input: 'test' };

      // Act
      const result = await testEngine.executeBatch([job]);

      // Assert - Should attempt 3 times (initial + 2 retries)
      expect(attempts).toBeGreaterThanOrEqual(2);
      expect(result[0].error).toBeUndefined();
    });

    it('should not retry non-recoverable errors', async () => {
      // Arrange
      let attempts = 0;
      const provider: InferenceProvider = {
        async infer() {
          attempts++;
          const error = new Error('Invalid API key');
          (error as Error & { code: string }).code = 'UNAUTHORIZED';
          throw error;
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1, maxRetries: 3 },
        () => provider
      );

      const job: InferenceJob = { id: '1', modelId: 'test', input: 'test' };

      // Act
      const result = await testEngine.executeBatch([job]);

      // Assert
      expect(attempts).toBe(1); // No retries for non-recoverable
      expect(result[0].error).toBeDefined();
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running jobs', async () => {
      // Arrange
      const slowProvider: InferenceProvider = {
        async infer() {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return { result: 'too late' };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1, defaultTimeout: 50 },
        () => slowProvider
      );

      const job: InferenceJob = { id: '1', modelId: 'slow', input: 'test' };

      // Act
      const result = await testEngine.executeBatch([job]);

      // Assert
      expect(result[0].error).toBeDefined();
      expect(result[0].error?.message).toContain('timed out');
    });

    it('should respect job-specific timeout', async () => {
      // Arrange
      const provider: InferenceProvider = {
        async infer() {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return { result: 'success' };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1, defaultTimeout: 10000 },
        () => provider
      );

      // Job with shorter timeout than default
      const job: InferenceJob = { 
        id: '1', 
        modelId: 'test', 
        input: 'test',
        timeout: 50 
      };

      // Act
      const result = await testEngine.executeBatch([job]);

      // Assert
      expect(result[0].error).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should track execution statistics', async () => {
      // Arrange
      const jobs: InferenceJob[] = [
        { id: '1', modelId: 'a', input: '1' },
        { id: '2', modelId: 'a', input: '2' },
        { id: '3', modelId: 'a', input: '3' },
      ];

      // Act
      await engine.executeBatch(jobs);
      const stats = engine.getStats();

      // Assert
      expect(stats.totalJobs).toBe(3);
      expect(stats.successfulJobs).toBe(3);
      expect(stats.failedJobs).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.avgLatency).toBeGreaterThan(0);
      expect(stats.minLatency).toBeGreaterThan(0);
      expect(stats.maxLatency).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      // Arrange
      let callCount = 0;
      const provider: InferenceProvider = {
        async infer() {
          callCount++;
          if (callCount % 2 === 0) throw new Error('Simulated failure');
          return { success: true };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 1 },
        () => provider
      );

      const jobs: InferenceJob[] = [
        { id: '1', modelId: 'a', input: '1' },
        { id: '2', modelId: 'a', input: '2' },
        { id: '3', modelId: 'a', input: '3' },
        { id: '4', modelId: 'a', input: '4' },
      ];

      // Act
      await testEngine.executeBatch(jobs);
      const stats = testEngine.getStats();

      // Assert - 2 successes, 2 failures
      expect(stats.successfulJobs).toBe(2);
      expect(stats.failedJobs).toBe(2);
      expect(stats.successRate).toBe(0.5);
    });

    it('should reset statistics', async () => {
      // Arrange
      await engine.executeBatch([{ id: '1', modelId: 'a', input: '1' }]);
      
      // Act
      engine.resetStats();
      const stats = engine.getStats();

      // Assert
      expect(stats.totalJobs).toBe(0);
      expect(stats.successfulJobs).toBe(0);
      expect(stats.avgLatency).toBe(0);
    });
  });

  describe('Concurrency Control', () => {
    it('should limit concurrent executions', async () => {
      // Arrange
      let concurrentCount = 0;
      let maxConcurrentObserved = 0;

      const provider: InferenceProvider = {
        async infer() {
          concurrentCount++;
          maxConcurrentObserved = Math.max(maxConcurrentObserved, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, 50));
          concurrentCount--;
          return { success: true };
        },
        async isAvailable() { return true; },
      };

      const testEngine = new ParallelInferenceEngine(
        { maxConcurrent: 2 },
        () => provider
      );

      const jobs: InferenceJob[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        modelId: 'a',
        input: String(i + 1),
      }));

      // Act
      await testEngine.executeBatch(jobs);

      // Assert
      expect(maxConcurrentObserved).toBeLessThanOrEqual(2);
    });
  });
});
