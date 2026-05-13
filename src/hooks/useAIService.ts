/**
 * useAIService - React Hook para el servicio de IA
 * 
 * Proporciona acceso reactivo al UnifiedAIService con:
 * - Estado de carga
 * - Manejo de errores
 - Reintentos automáticos
 * - Cancelación de jobs
 * - Métricas en tiempo real
 */

'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  UnifiedAIService,
  getUnifiedAIService,
  ServiceJob,
  ServiceJobResult,
  BatchJobRequest,
  ServiceHealth,
  ServiceMetrics,
  QueueStats,
} from '@/infrastructure/ai';
import { CommentAnalysis, ChapterSummary, QualityAssessment } from '@/core/services/IAProvider';

// ============================================================================
// Types
// ============================================================================

interface UseAIServiceOptions {
  autoStart?: boolean;
  onError?: (error: Error) => void;
  onJobComplete?: (jobId: string, result: unknown) => void;
  retryAttempts?: number;
}

interface AIServiceState {
  isReady: boolean;
  isProcessing: boolean;
  health: ServiceHealth | null;
  queueDepth: number;
}

interface JobState<T = unknown> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  jobId: string | null;
}

// ============================================================================
// Service Store (for useSyncExternalStore)
// ============================================================================

let serviceInstance: UnifiedAIService | null = null;
let listeners: Set<() => void> = new Set();

function getService(): UnifiedAIService {
  if (!serviceInstance) {
    serviceInstance = getUnifiedAIService();
  }
  return serviceInstance;
}

function subscribeToService(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((l) => l());
}

// ============================================================================
// Main Hook
// ============================================================================

export function useAIService(options: UseAIServiceOptions = {}) {
  const { autoStart = true, onError, onJobComplete, retryAttempts = 3 } = options;
  
  const service = getService();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  
  const [state, setState] = useState<AIServiceState>({
    isReady: false,
    isProcessing: false,
    health: null,
    queueDepth: 0,
  });

  // Initialize service
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (autoStart && !service['isRunning']) {
        await service.start();
      }
      
      if (mounted) {
        setState((prev) => ({
          ...prev,
          isReady: service['isRunning'],
          health: service.getHealth(),
        }));
      }
    };

    init();

    // Setup event listeners
    const handleJobCompleted = (payload: { jobId: string; result?: unknown }) => {
      onJobComplete?.(payload.jobId, payload.result);
      notifyListeners();
    };

    const handleHealthCheck = () => {
      if (mounted) {
        setState((prev) => ({
          ...prev,
          health: service.getHealth(),
          queueDepth: service.getQueueStats().length,
        }));
      }
    };

service.on('job:completed', handleJobCompleted);
service.on('health:check-completed', handleHealthCheck);

    // Polling for queue depth
    const interval = setInterval(() => {
      if (mounted) {
        setState((prev) => ({
          ...prev,
          queueDepth: service.getQueueStats().length,
        }));
      }
    }, 1000);

    return () => {
      mounted = false;
      service.off('job:completed', handleJobCompleted);
      service.off('health:check-completed', handleHealthCheck);
      clearInterval(interval);
      
      // Cancel all pending abort controllers
      abortControllersRef.current.forEach((controller) => {
        try { controller.abort(); } catch { console.info('[useAIService] AbortController already aborted'); }
      });
      abortControllersRef.current.clear();
    };
  }, [autoStart, onJobComplete, service]);

  // ==========================================================================
  // Core Methods
  // ==========================================================================

  const submit = useCallback(<T = unknown>(
    job: ServiceJob,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<T>> => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      const jobId = job.id ?? crypto.randomUUID();
      
      abortControllersRef.current.set(jobId, abortController);
      
      // Link external signal if provided
      if (signal) {
        signal.addEventListener('abort', () => {
          abortController.abort();
        });
      }
      
      const attemptSubmit = async (attempt: number): Promise<void> => {
        try {
          if (abortController.signal.aborted) {
            throw new Error('Job was cancelled');
          }
          
          const result = await service.submit<T>({
            ...job,
            id: jobId,
          });
          
          setState((prev) => ({ ...prev, isProcessing: false }));
          abortControllersRef.current.delete(jobId);
          resolve(result);
        } catch (error) {
          if (attempt < retryAttempts && !abortController.signal.aborted) {
            setTimeout(() => attemptSubmit(attempt + 1), 1000 * attempt);
          } else {
            setState((prev) => ({ ...prev, isProcessing: false }));
            abortControllersRef.current.delete(jobId);
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            reject(err);
          }
        }
      };
      
      attemptSubmit(0);
    });
  }, [onError, retryAttempts, service]);

  const submitBatch = useCallback(<T = unknown>(
    request: BatchJobRequest,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<T>[]> => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    return service.submitBatch<T>(request)
      .finally(() => {
        setState((prev) => ({ ...prev, isProcessing: false }));
      });
  }, [service]);

  const cancelJob = useCallback((jobId: string): boolean => {
    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
      return true;
    }
    return false;
  }, []);

  // ==========================================================================
  // Specialized Methods
  // ==========================================================================

  const analyzeComment = useCallback((
    content: string,
    context?: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<CommentAnalysis>> => {
    return service.analyzeComment(content, context);
  }, [service]);

  const detectSpoiler = useCallback((
    content: string,
    chapterContext: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<number>> => {
    return service.detectSpoiler(content, chapterContext);
  }, [service]);

  const summarizeChapter = useCallback((
    chapterText: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<ChapterSummary>> => {
    return service.summarizeChapter(chapterText);
  }, [service]);

  const generateEmbedding = useCallback((
    text: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<number[]>> => {
    return service.generateEmbedding(text);
  }, [service]);

  const classifyGenre = useCallback((
    prompt: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<string[]>> => {
    return service.classifyGenre(prompt);
  }, [service]);

  const classifyQuality = useCallback((
    imageUrl: string,
    signal?: AbortSignal
  ): Promise<ServiceJobResult<QualityAssessment>> => {
    return service.classifyQuality(imageUrl);
  }, [service]);

  // ==========================================================================
  // Monitoring
  // ==========================================================================

  const getHealth = useCallback((): ServiceHealth => {
    return service.getHealth();
  }, [service]);

  const getMetrics = useCallback((): ServiceMetrics => {
    return service.getMetrics();
  }, [service]);

  const getQueueStats = useCallback((): QueueStats => {
    return service.getQueueStats();
  }, [service]);

  return {
    // State
    ...state,
    
    // Core methods
    submit,
    submitBatch,
    cancelJob,
    
    // Specialized methods
    analyzeComment,
    detectSpoiler,
    summarizeChapter,
    generateEmbedding,
    classifyGenre,
    classifyQuality,
    
    // Monitoring
    getHealth,
    getMetrics,
    getQueueStats,
    
    // Direct service access for advanced use cases
    service,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for real-time health monitoring
 */
export function useAIServiceHealth(pollInterval = 5000): ServiceHealth {
  const service = getService();
  
  return useSyncExternalStore(
    subscribeToService,
    () => service.getHealth(),
    () => service.getHealth()
  );
}

/**
 * Hook for submitting a single job with state management
 */
export function useAIJob<T = unknown>(jobType: ServiceJob['type']) {
  const [state, setState] = useState<JobState<T>>({
    data: null,
    error: null,
    isLoading: false,
    jobId: null,
  });
  
  const { submit, cancelJob } = useAIService();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    payload: unknown,
    options?: Partial<ServiceJob>
  ): Promise<ServiceJobResult<T>> => {
    // Cancel previous job if exists
    if (state.jobId) {
      cancelJob(state.jobId);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState((prev) => ({ ...prev, isLoading: true, error: null, data: null }));
    
    try {
      const result = await submit<T>({
        type: jobType,
        payload,
        ...options,
      }, abortControllerRef.current.signal);
      
      if (result.success && result.data !== undefined) {
        setState({
          data: result.data,
          error: null,
          isLoading: false,
          jobId: result.jobId,
        });
      } else {
        setState({
          data: null,
          error: new Error(result.error?.message ?? 'Unknown error'),
          isLoading: false,
          jobId: result.jobId,
        });
      }
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        error: err,
        isLoading: false,
        jobId: null,
      });
      throw error;
    }
  }, [jobType, submit, cancelJob, state.jobId]);

  const reset = useCallback(() => {
    if (state.jobId) {
      cancelJob(state.jobId);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      data: null,
      error: null,
      isLoading: false,
      jobId: null,
    });
  }, [cancelJob, state.jobId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (state.jobId) {
        cancelJob(state.jobId);
      }
    };
  }, [cancelJob, state.jobId]);

  return {
    ...state,
    execute,
    reset,
    cancel: () => state.jobId && cancelJob(state.jobId),
  };
}

/**
 * Hook for batch job processing
 */
export function useAIBatch<T = unknown>() {
  const [results, setResults] = useState<ServiceJobResult<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, failed: 0, total: 0 });
  
  const { submitBatch } = useAIService();

  const execute = useCallback(async (request: BatchJobRequest): Promise<void> => {
    setIsProcessing(true);
    setProgress({ completed: 0, failed: 0, total: request.jobs.length });
    
    const batchResults = await submitBatch<T>(request);
    
    setResults(batchResults);
    setProgress({
      completed: batchResults.filter((r) => r.success).length,
      failed: batchResults.filter((r) => !r.success).length,
      total: batchResults.length,
    });
    setIsProcessing(false);
  }, [submitBatch]);

  const reset = useCallback(() => {
    setResults([]);
    setProgress({ completed: 0, failed: 0, total: 0 });
    setIsProcessing(false);
  }, []);

  return {
    results,
    isProcessing,
    progress,
    execute,
    reset,
  };
}

export default useAIService;
