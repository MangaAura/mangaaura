'use client';

import { Sun, Moon } from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { useT } from '@/i18n';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();

  const isDark = theme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(next)}
      className="group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1"
      title={isDark ? t('theme.light') : t('theme.dark')}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
    >
      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
    </button>
  );
}
