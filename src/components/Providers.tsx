'use client';

import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { SWRConfig } from 'swr';

import { KeyboardShortcutsProvider } from './Layout/KeyboardShortcutsProvider';
import { TourProvider } from './OnboardingTour';
import { ThemeProvider } from './ThemeProvider';
import { AxeCoreProvider } from '@/components/A11y/AxeCoreProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider, type Locale } from '@/i18n/index';
import { swrConfig } from '@/lib/swr-config';

// Lazy-load only ScrollProgressBar — it's alongside children, not wrapping them.
// Providers that wrap {children} CANNOT use dynamic(ssr:false) because they'd
// prevent server-side rendering of the entire page content.
const ScrollProgressBar = dynamic(() => import('./Layout/ScrollProgressBar').then(m => ({ default: m.ScrollProgressBar })), { ssr: false });

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
                <TourProvider>
                  <KeyboardShortcutsProvider>
                    <Suspense fallback={null}>
                      <ScrollProgressBar />
                    </Suspense>
                    {children}
                  </KeyboardShortcutsProvider>
                </TourProvider>
              </AxeCoreProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
