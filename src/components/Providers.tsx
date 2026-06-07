'use client';

import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';
import { Suspense, useEffect } from 'react';
import { SWRConfig } from 'swr';

import { KeyboardShortcutsProvider } from './Layout/KeyboardShortcutsProvider';
import { initCSRFProtection } from '@/lib/csrf';
import { TourProvider } from './OnboardingTour';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider, type Locale } from '@/i18n/index';
import { swrConfig } from '@/lib/swr-config';

// Lazy-load only ScrollProgressBar — it's alongside children, not wrapping them.
// Providers that wrap {children} CANNOT use dynamic(ssr:false) because they'd
// prevent server-side rendering of the entire page content.
const ScrollProgressBar = dynamic(() => import('./Layout/ScrollProgressBar').then(m => ({ default: m.ScrollProgressBar })), { ssr: false });

// AxeCoreProvider is development-only — dynamically imported so it's NOT bundled in production.
// In production, a noop provider is used instead, saving ~30KB+ from every page bundle.
const DevAxeCoreProvider = dynamic(
  () => import('@/components/A11y/AxeCoreProvider').then(m => ({ default: m.AxeCoreProvider })),
  { ssr: false }
);
const NoopProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const AxeCoreProvider = process.env.NODE_ENV === 'development' ? DevAxeCoreProvider : NoopProvider;

interface ProvidersProps {
  children: React.ReactNode;
  locale?: Locale;
}

export function Providers({ children, locale }: ProvidersProps) {
  useEffect(() => { initCSRFProtection(); }, []);
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
