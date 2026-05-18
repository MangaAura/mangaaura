import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useEscapeKey } from '@/hooks/useEscapeKey';

describe('useEscapeKey', () => {
  it('fires callback on Escape key press', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire callback on other keys', () => {
    const handler = vi.fn();
    renderHook(() => useEscapeKey(handler));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(handler));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire after handler reference changes and unmount', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ handler }) => useEscapeKey(handler),
      { initialProps: { handler: handler1 } }
    );

    rerender({ handler: handler2 });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1).not.toHaveBeenCalled();

    unmount();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
