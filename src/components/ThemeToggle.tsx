'use client';

import { CircleDot, Circle, Monitor } from 'lucide-react';

import { useTheme } from './ThemeProvider';
import { useT } from '@/i18n';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();

  const options: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; labelKey: string }[] = [
    { value: 'light', icon: CircleDot, labelKey: 'theme.light' },
    { value: 'dark', icon: Circle, labelKey: 'theme.dark' },
    { value: 'system', icon: Monitor, labelKey: 'theme.system' },
  ];

  return (
    <div className="theme-toggle-wrapper">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`
              flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1
              ${isActive 
                ? 'bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
              }
            `}
            aria-label={t(option.labelKey)}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
