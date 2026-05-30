'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';

import { AxeCoreProvider } from '@/components/A11y/AxeCoreProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider, type Locale } from '@/i18n/index';
import { swrConfig } from '@/lib/swr-config';

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
              <AxeCoreProvider>
                {children}
              </AxeCoreProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
