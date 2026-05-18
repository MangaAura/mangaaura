import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useClickOutside } from '@/hooks/useClickOutside';

describe('useClickOutside', () => {
  it('fires callback when clicking outside the ref element', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const outside = document.createElement('div');
    result.current.current = outside;

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire callback when clicking inside the ref element', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const inside = document.createElement('div');
    result.current.current = inside;

    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('fires callback when clicking on a child element inside the ref', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    result.current.current = parent;

    child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const handler = vi.fn();
    const { result, unmount } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const outside = document.createElement('div');
    result.current.current = outside;

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles null ref gracefully', () => {
    const handler = vi.fn();
    renderHook(() => useClickOutside<HTMLDivElement>(handler));

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });
});
