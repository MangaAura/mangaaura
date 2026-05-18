import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrolled } from '@/hooks/useScrolled';

describe('useScrolled', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false initially when scrollY is 0', () => {
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(false);
  });

  it('returns false initially when scrollY is below threshold', () => {
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
    const { result } = renderHook(() => useScrolled(50));
    expect(result.current).toBe(false);
  });

  it('returns true after scrolling past default threshold', () => {
    const { result } = renderHook(() => useScrolled());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 1, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('returns true when scrolled past a custom threshold', () => {
    const { result } = renderHook(() => useScrolled(100));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('returns false when scroll is below threshold after being above', () => {
    const { result } = renderHook(() => useScrolled(50));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(false);
  });

  it('adds scroll event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useScrolled());

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useScrolled());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
