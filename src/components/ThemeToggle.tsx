'use client';

import { Sun, Moon, BookMarked } from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { useT } from '@/i18n';

export function ThemeToggle() {
  const { theme, setTheme, themeVariant } = useTheme();
  const t = useT();

  // For the toggle, we use the resolved theme (actual light/dark, not 'system')
  // The themeVariant doesn't affect the light/dark toggle — it's a separate axis
  const isDark = theme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(next)}
      className="group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1"
      title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
    >
      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
      {themeVariant === 'mangaPaper' && (
        <BookMarked className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-[var(--text-tertiary)] opacity-60" aria-hidden="true" />
      )}
    </button>
  );
}
