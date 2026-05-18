'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

export interface ShortcutConfig {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
  target?: HTMLElement | Window | null;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  target = typeof window !== 'undefined' ? window : null,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  const [enabledState, setEnabledState] = useState(enabled);

  // Keep refs and state in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    setEnabledState(enabled);
  }, [enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement?.tagName === 'INPUT' ||
                          activeElement?.tagName === 'TEXTAREA' ||
                          activeElement?.getAttribute('contenteditable') === 'true';

    for (const shortcut of shortcutsRef.current) {
      const { key, modifiers = {}, action, preventDefault = true } = shortcut;

      // Check if key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase() ||
                        event.code === key;

      if (!keyMatches) continue;

      // Check modifiers
      const ctrlMatch = modifiers.ctrl === undefined || event.ctrlKey === modifiers.ctrl;
      const shiftMatch = modifiers.shift === undefined || event.shiftKey === modifiers.shift;
      const altMatch = modifiers.alt === undefined || event.altKey === modifiers.alt;
      const metaMatch = modifiers.meta === undefined || event.metaKey === modifiers.meta;

      if (ctrlMatch && shiftMatch && altMatch && metaMatch) {
        // Skip if input is focused and it's a navigation key
        if (isInputFocused && !modifiers.ctrl && !modifiers.alt && !modifiers.meta) {
          continue;
        }

        if (preventDefault) {
          event.preventDefault();
        }

        action();
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabledState || !target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabledState, target, handleKeyDown]);
}

// Preset shortcuts for reader
export const createReaderShortcuts = (
  actions: {
    nextPage: () => void;
    prevPage: () => void;
    toggleFullscreen: () => void;
    exitFullscreen: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    toggleSettings: () => void;
    toggleComments: () => void;
    toggleDoublePage: () => void;
    toggleReadingDirection: () => void;
  }
): ShortcutConfig[] => [
  {
    key: 'ArrowRight',
    action: actions.nextPage,
    description: 'Next page',
  },
  {
    key: 'ArrowDown',
    action: actions.nextPage,
    description: 'Next page',
  },
  {
    key: 'ArrowLeft',
    action: actions.prevPage,
    description: 'Previous page',
  },
  {
    key: 'ArrowUp',
    action: actions.prevPage,
    description: 'Previous page',
  },
  {
    key: ' ',
    action: actions.nextPage,
    description: 'Next page',
    preventDefault: true,
  },
  {
    key: 'f',
    action: actions.toggleFullscreen,
    description: 'Toggle fullscreen',
  },
  {
    key: 'Escape',
    action: actions.exitFullscreen,
    description: 'Exit fullscreen',
  },
  {
    key: '+',
    modifiers: { shift: true },
    action: actions.zoomIn,
    description: 'Zoom in',
  },
  {
    key: '=',
    modifiers: { shift: false },
    action: actions.zoomIn,
    description: 'Zoom in',
  },
  {
    key: '-',
    action: actions.zoomOut,
    description: 'Zoom out',
  },
  {
    key: '0',
    action: actions.resetZoom,
    description: 'Reset zoom',
  },
  {
    key: 's',
    action: actions.toggleSettings,
    description: 'Toggle settings',
  },
  {
    key: 'c',
    action: actions.toggleComments,
    description: 'Toggle comments',
  },
  {
    key: 'd',
    action: actions.toggleDoublePage,
    description: 'Toggle double page mode',
  },
  {
    key: 'r',
    action: actions.toggleReadingDirection,
    description: 'Toggle reading direction',
  },
];
