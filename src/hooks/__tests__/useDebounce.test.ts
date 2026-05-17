import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('updates debounced value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('does not update on rapid changes before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'change1', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('initial');

    rerender({ value: 'change2', delay: 500 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('initial');

    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('change2');
  });

  it('cancels previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    rerender({ value: 'c', delay: 500 });
    rerender({ value: 'd', delay: 500 });

    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('d');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    rerender({ value: 42, delay: 300 });

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  it('cleans up timer on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    unmount();

    act(() => { vi.advanceTimersByTime(500); });

    expect(result.current).toBe('initial');
  });
});
