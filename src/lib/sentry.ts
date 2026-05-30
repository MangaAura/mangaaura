/**
 * Sentry helper utilities
 *
 * Proporciona wrappers seguros para Sentry que no rompen
 * si Sentry no está configurado (desarrollo local sin DSN).
 *
 * @packageDocumentation
 */

let sentryModule: typeof import('@sentry/nextjs') | null = null;

async function getSentry(): Promise<typeof import('@sentry/nextjs') | null> {
  if (sentryModule) return sentryModule;
  try {
    sentryModule = await import('@sentry/nextjs');
    return sentryModule;
  } catch {
    return null;
  }
}

/**
 * Captura una excepción en Sentry de forma segura.
 * No lanza error si Sentry no está disponible/instalado.
 */
export async function captureException(
  error: unknown,
  context?: { extra?: Record<string, unknown> },
): Promise<void> {
  try {
    const Sentry = await getSentry();
    if (Sentry?.getClient?.()) {
      Sentry.captureException(error, { extra: context?.extra });
    }
  } catch {
    // Sentry not available — silently skip
  }
}

/**
 * Captura un mensaje en Sentry de forma segura.
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: { extra?: Record<string, unknown> },
): Promise<void> {
  try {
    const Sentry = await getSentry();
    if (Sentry?.getClient?.()) {
      Sentry.captureMessage(message, {
        level,
        extra: context?.extra,
      });
    }
  } catch {
    // Sentry not available — silently skip
  }
}
