'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';
import { I18nProvider, type Locale } from '@/i18n/index';

interface ProvidersProps {
  children: React.ReactNode;
  locale?: Locale;
}

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <SessionProvider>
      <SWRConfig value={swrConfig}>
        <I18nProvider defaultLocale={locale}>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
