'use client';

import dynamic from 'next/dynamic';

const KeyboardShortcutsInner = dynamic(
  () => import('./KeyboardShortcutsInner').then((m) => ({ default: m.KeyboardShortcutsInner })),
  { ssr: false }
);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KeyboardShortcutsInner />
      {children}
    </>
  );
}
