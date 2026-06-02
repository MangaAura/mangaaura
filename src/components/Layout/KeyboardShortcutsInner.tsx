'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsInner() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts = [
    { keys: ['/'], description: 'Show shortcut help', action: () => setShowHelp((v) => !v) },
    { keys: ['g', 'h'], description: 'Go to Home', action: () => router.push('/') },
    { keys: ['g', 'e'], description: 'Go to Explore', action: () => router.push('/explore') },
    { keys: ['g', 'l'], description: 'Go to Library', action: () => router.push('/library') },
    { keys: ['g', 'p'], description: 'Go to Profile', action: () => router.push('/profile') },
    { keys: ['g', 's'], description: 'Go to Settings', action: () => router.push('/settings') },
    { keys: ['g', 'c'], description: 'Go to Community', action: () => router.push('/community') },
    { keys: ['g', 'r'], description: 'Go to Rankings', action: () => router.push('/rankings') },
    { keys: ['g', 'n'], description: 'Go to Notifications', action: () => router.push('/notifications') },
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (showHelp) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowHelp(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [showHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {shortcuts.filter(s => s.keys[0] !== 'Escape').map((s) => (
            <div key={s.keys.join('')} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">{s.description}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--surface-sunken)] border border-[var(--border)] rounded text-[var(--text-primary)]">
                {s.keys.join(' then ')}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">Press Escape to close</p>
      </div>
    </div>
  );
}
