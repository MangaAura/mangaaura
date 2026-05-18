'use client';

import { Languages } from 'lucide-react';

import { useLocale, useT } from '@/i18n/index';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
}

export function LanguageSwitcher({ className, variant = 'toggle' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  if (variant === 'toggle') {
    return (
    <button
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-100 cursor-pointer',
        'bg-secondary text-muted hover:text-fg-primary hover:bg-tertiary border border-custom',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        className
      )}
      aria-label={`${locale === 'es' ? t('language.en') : t('language.es')} (${locale.toUpperCase()})`}
    >
        <Languages className="w-4 h-4" aria-hidden="true" />
        <span>{locale.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 bg-tertiary rounded-lg p-1', className)}>
      <button
        onClick={() => setLocale('es')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
          locale === 'es' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label={t('language.es')}
      >
        {t('language.es')}
      </button>
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
          locale === 'en' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label={t('language.en')}
      >
        {t('language.en')}
      </button>
    </div>
  );}
