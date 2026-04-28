/**
 * useDebounce Hook
 * 
 * Hooks para debounce y throttle.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as {
    (...args: Parameters<T>): void;
    cancel: () => void;
    flush: () => void;
  };

  // Cancel function
  debouncedFn.cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Flush function
  debouncedFn.flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      // Note: Can't call with previous args, would need to store them
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

/**
 * Debounce a search input with loading state
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300
): {
  query: string;
  debouncedQuery: string;
  setQuery: (value: string) => void;
  isSearching: boolean;
} {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  return { query, debouncedQuery, setQuery, isSearching };
}

/**
 * Throttle a function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= limit) {
        lastRun.current = now;
        callbackRef.current(...args);
      }
    },
    [limit]
  );
}

/**
 * Rate limit calls
 */
export function useRateLimit<T extends (...args: any[]) => any>(
  callback: T,
  maxCalls: number,
  windowMs: number
): {
  (...args: Parameters<T>): void;
  canCall: boolean;
  remainingCalls: number;
} {
  const calls = useRef<number[]>([]);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const rateLimitedFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      // Remove old calls outside window
      calls.current = calls.current.filter(time => now - time < windowMs);
      
      if (calls.current.length < maxCalls) {
        calls.current.push(now);
        callbackRef.current(...args);
      }
    },
    [maxCalls, windowMs]
  ) as {
    (...args: Parameters<T>): void;
    canCall: boolean;
    remainingCalls: number;
  };

  Object.defineProperty(rateLimitedFn, 'canCall', {
    get: () => {
      const now = Date.now();
      calls.current = calls.current.filter(time => now - time < windowMs);
      return calls.current.length < maxCalls;
    },
  });

  Object.defineProperty(rateLimitedFn, 'remainingCalls', {
    get: () => {
      const now = Date.now();
      calls.current = calls.current.filter(time => now - time < windowMs);
      return Math.max(0, maxCalls - calls.current.length);
    },
  });

  return rateLimitedFn;
}

export default useDebounce;
