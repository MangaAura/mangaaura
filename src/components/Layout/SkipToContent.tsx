'use client';

import { useT } from '@/i18n';

export function SkipToContent() {
  const t = useT();

  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-3 focus:rounded-lg focus:text-sm focus:font-semibold
        focus:text-[var(--text-inverse)] focus:bg-[var(--primary)]
        focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
        focus:ring-offset-[var(--background)]
        transition-none
      "
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
