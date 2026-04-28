import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Sample rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay settings
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filters
  ignoreErrors: [
    // Network errors
    'Network Error',
    'Failed to fetch',
    'AbortError',
    // Auth errors
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
    // Common browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'The user aborted a request',
    'Network request failed',
  ],

  // Before send hook
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  // Debug in development
  debug: process.env.NODE_ENV === 'development',
});
