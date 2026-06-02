'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    let buffer = '';
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for single-key shortcuts
      for (const shortcut of shortcuts) {
        if (shortcut.keys.length === 1 && e.key.toLowerCase() === shortcut.keys[0].toLowerCase()) {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }

      // Check for multi-key sequences (g then e, g then h, etc.)
      if (timeout) clearTimeout(timeout);
      buffer += e.key.toLowerCase();
      for (const shortcut of shortcuts) {
        if (shortcut.keys.length > 1) {
          const seq = shortcut.keys.join('');
          if (buffer === seq) {
            e.preventDefault();
            shortcut.action();
            buffer = '';
            return;
          }
        }
      }
      timeout = setTimeout(() => { buffer = ''; }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeout) clearTimeout(timeout);
    };
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    { keys: ['?'], description: 'Mostrar ayuda de atajos', action: () => {} },
    { keys: ['g', 'h'], description: 'Ir a inicio', action: () => router.push('/') },
    { keys: ['g', 'e'], description: 'Ir a explorar', action: () => router.push('/explore') },
    { keys: ['g', 'l'], description: 'Ir a biblioteca', action: () => router.push('/library') },
    { keys: ['g', 'p'], description: 'Ir a perfil', action: () => router.push('/profile') },
    { keys: ['g', 's'], description: 'Ir a ajustes', action: () => router.push('/settings') },
    { keys: ['g', 'c'], description: 'Ir a comunidad', action: () => router.push('/community') },
    { keys: ['g', 'r'], description: 'Ir a rankings', action: () => router.push('/rankings') },
    { keys: ['g', 'n'], description: 'Ir a notificaciones', action: () => router.push('/notifications') },
  ];

  return shortcuts;
}
