'use client';

import { usePathname, useRouter } from 'next/navigation';

import { useLocale, useT } from '@/i18n/index';
import { cn } from '@/lib/utils';

function pathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(es|en)(\/|$)/, '/') || '/';
}

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
}

function SpainFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="18" fill="#c60b1e"/>
      <rect y="3" width="24" height="12" fill="#ffc400"/>
      <rect y="6" width="24" height="6" fill="#c60b1e"/>
      <ellipse cx="12" cy="9" rx="2.5" ry="3" fill="#c60b1e"/>
      <ellipse cx="12" cy="9" rx="1.8" ry="2.3" fill="#ffc400"/>
    </svg>
  );
}

function UKFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="18" fill="#012169"/>
      <path d="M0 0l24 18M24 0L0 18" stroke="#fff" strokeWidth="4"/>
      <path d="M0 0l24 18M24 0L0 18" stroke="#c8102e" strokeWidth="2"/>
      <path d="M12 0v18M0 9h24" stroke="#fff" strokeWidth="6"/>
      <path d="M12 0v18M0 9h24" stroke="#c8102e" strokeWidth="4"/>
      <path d="M0 0l4 4m20-4l-4 4M0 18l4-4m20 4l-4-4" stroke="#fff" strokeWidth="2"/>
    </svg>
  );
}

export function LanguageSwitcher({ className, variant = 'toggle' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  const switchTo = (newLocale: string) => {
    const basePath = pathWithoutLocale(pathname);
    const newPath = `/${newLocale}${basePath === '/' ? '' : basePath}`;
    setLocale(newLocale as 'es' | 'en');
    router.push(newPath);
  };

  if (variant === 'toggle') {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    const Flag = locale === 'es' ? SpainFlag : UKFlag;
    return (
    <button
      onClick={() => switchTo(nextLocale)}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-100 cursor-pointer',
        'bg-secondary text-muted hover:text-fg-primary hover:bg-tertiary border border-custom',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        className
      )}
      aria-label={`${locale === 'es' ? t('language.en') : t('language.es')} (${locale.toUpperCase()})`}
    >
        <Flag className="w-4 h-4" />
        <span>{locale.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 bg-tertiary rounded-lg p-1', className)}>
      <button
        onClick={() => switchTo('es')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
          locale === 'es' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label={t('language.es')}
      >
        <SpainFlag className="w-4 h-4" />
        {t('language.es')}
      </button>
      <button
        onClick={() => switchTo('en')}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
          locale === 'en' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'
        )}
        aria-label={t('language.en')}
      >
        <UKFlag className="w-4 h-4" />
        {t('language.en')}
      </button>
    </div>
  );}
