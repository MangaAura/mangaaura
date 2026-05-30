'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

interface RetryState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

interface UseRetryReturn<T> extends RetryState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

export function useRetry<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<RetryState<T>>({
    data: null,
    isLoading: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const argsRef = useRef<unknown[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      argsRef.current = args;
      
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        isRetrying: prev.retryCount > 0,
      }));

      try {
        const result = await asyncFn(...args);
        setState({
          data: result,
          isLoading: false,
          error: null,
          retryCount: 0,
          isRetrying: false,
        });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          isRetrying: false,
        }));
        
        return null;
      }
    },
    [asyncFn]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    const currentRetryCount = state.retryCount;
    
    if (currentRetryCount >= maxRetries) {
      onMaxRetriesReached?.();
      return null;
    }

    const nextRetryCount = currentRetryCount + 1;
    const delay = retryDelay * Math.pow(backoffMultiplier, currentRetryCount);

    onRetry?.(nextRetryCount);

    setState((prev) => ({
      ...prev,
      retryCount: nextRetryCount,
      isRetrying: true,
    }));

    // Wait before retrying
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        const result = await execute(...argsRef.current);
        resolve(result);
      }, delay);
    });
  }, [execute, maxRetries, retryDelay, backoffMultiplier, onRetry, onMaxRetriesReached, state.retryCount]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      data: null,
      isLoading: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
    argsRef.current = [];
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
  };
}

// Hook for auto-retry on error
export function useAutoRetry<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseRetryOptions & { autoRetry?: boolean } = {}
): UseRetryReturn<T> {
  const { autoRetry = true, ...retryOptions } = options;
  const retryHook = useRetry(asyncFn, retryOptions);
  const { error, retryCount, execute: _execute } = retryHook;
  const [hasRetried, setHasRetried] = useState(false);

   
  // auto-retry pattern uses ref + effect to avoid cascading renders
  const hasRetriedRef = useRef(false);
   
  useEffect(() => {
    if (error && autoRetry && retryCount < (options.maxRetries || 3) && !hasRetriedRef.current) {
      hasRetriedRef.current = true;
      const timer = setTimeout(() => {
        if (!hasRetried) setHasRetried(true);
        retryHook.retry();
      }, 0);
      return () => clearTimeout(timer);
    }
    // retryHook.retry() intentionally triggers state changes for auto-retry
  }, [error, autoRetry, retryCount, options.maxRetries, hasRetried, retryHook]);

  // Reset flag when successful
  useEffect(() => {
    if (!error && hasRetried) {
      hasRetriedRef.current = false;
      const timer = setTimeout(() => setHasRetried(false), 0);
      return () => clearTimeout(timer);
    }
  }, [error, hasRetried]);

  return retryHook;
}

// Hook with optimistic updates
export function useOptimisticRetry<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseRetryOptions & {
    optimisticData?: T;
    rollbackOnError?: boolean;
  } = {}
): UseRetryReturn<T> & {
  optimisticData: T | null;
} {
  const { optimisticData, rollbackOnError = true } = options;
  const [optimisticState, setOptimisticState] = useState<T | null>(null);
  const previousDataRef = useRef<T | null>(null);

  const wrappedFn = useCallback(
    async (...args: unknown[]): Promise<T> => {
      // Store previous data for rollback
      previousDataRef.current = optimisticState;
      
      // Set optimistic data
      if (optimisticData !== undefined) {
        setOptimisticState(optimisticData);
      }

      try {
        const result = await asyncFn(...args);
        setOptimisticState(result);
        return result;
      } catch (error) {
        // Rollback on error
        if (rollbackOnError) {
          setOptimisticState(previousDataRef.current);
        }
        throw error;
      }
    },
    [asyncFn, optimisticData, rollbackOnError, optimisticState]
  );

  const retryHook = useRetry(wrappedFn, options);

  return {
    ...retryHook,
    optimisticData: optimisticState,
  };
}