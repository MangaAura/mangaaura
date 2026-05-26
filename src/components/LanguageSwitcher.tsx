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

function FlagCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/20">
      {children}
    </div>
  );
}

function SpainFlag() {
  return (
    <FlagCircle>
      <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="24" height="24" fill="#c60b1e"/>
        <rect y="6" width="24" height="12" fill="#ffc400"/>
      </svg>
    </FlagCircle>
  );
}

function USFlag() {
  return (
    <FlagCircle>
      <svg viewBox="0 0 24 18" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="24" height="18" fill="#b22234"/>
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={(i * 18) / 13} width="24" height={18 / 13} fill="#fff" />
        ))}
        <rect width="10.4" height="10.4" fill="#3c3b6e" />
      </svg>
    </FlagCircle>
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
    const Flag = locale === 'es' ? SpainFlag : USFlag;
    return (
      <button
        onClick={() => switchTo(nextLocale)}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-100 cursor-pointer',
          'bg-secondary text-muted hover:text-fg-primary hover:bg-tertiary border border-custom',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
          className
        )}
        aria-label={`${locale === 'es' ? t('language.en') : t('language.es')}`}
      >
        <Flag />
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 p-1 rounded-full bg-secondary border border-custom', className)}>
      <button
        onClick={() => switchTo('es')}
        className={cn(
          'p-1 rounded-full transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
          locale === 'es' ? 'bg-tertiary shadow-sm ring-1 ring-black/10 dark:ring-white/20' : 'opacity-50 hover:opacity-100'
        )}
        aria-label={t('language.es')}
      >
        <SpainFlag />
      </button>
      <button
        onClick={() => switchTo('en')}
        className={cn(
          'p-1 rounded-full transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
          locale === 'en' ? 'bg-tertiary shadow-sm ring-1 ring-black/10 dark:ring-white/20' : 'opacity-50 hover:opacity-100'
        )}
        aria-label={t('language.en')}
      >
        <USFlag />
      </button>
    </div>
  );
}
