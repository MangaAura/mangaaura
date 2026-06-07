'use client';

import { BookOpen, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'mangaaura-exit-intent-dismissed';
const DELAY_MS = 3000;

function getStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch { /* noop */ }
}

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(getStorage());

  const handleExit = useCallback((e: MouseEvent) => {
    if (dismissedRef.current) return;
    if (e.clientY > 0) return;
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    dismissedRef.current = true;
    setStorage();
  }, []);

  useEffect(() => {
    if (dismissedRef.current) return;
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleExit);
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleExit);
    };
  }, [handleExit]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4 p-8 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border)] shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            ¿Te vas tan pronto?
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Miles de mangas gratis te esperan. Crea tu cuenta y empieza a leer en segundos.
          </p>
          <Link
            href="/auth/register"
            onClick={handleDismiss}
            className="inline-flex items-center justify-center h-12 w-full px-6 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 mb-3"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))' }}
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/explore"
            onClick={handleDismiss}
            className="inline-flex items-center justify-center h-12 w-full px-6 rounded-xl text-base font-semibold border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-colors"
          >
            Explorar sin cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
