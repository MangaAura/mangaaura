'use client';

import { useLocale } from '@/i18n/index';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
}

export function LanguageSwitcher({ className, variant = 'toggle' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  if (variant === 'toggle') {
    return (
    <button
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-100 cursor-pointer',
        'bg-secondary text-muted hover:text-fg-primary hover:bg-tertiary border border-custom',
        className
      )}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={locale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
    >
        <Languages className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 bg-tertiary rounded-lg p-1', className)}>
      <button
        onClick={() => setLocale('es')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
          locale === 'es' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
          locale === 'en' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}