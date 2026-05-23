export async function register() {
  // The @sentry/nextjs SDK automatically picks up sentry.server.config.ts
  // and sentry.client.config.ts. This instrumentation.ts file ensures
  // Next.js hooks into the App Router lifecycle properly.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Ensure server-side Sentry initialization happens at startup
    await import('../sentry.server.config');
  }
}
