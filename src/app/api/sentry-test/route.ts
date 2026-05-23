import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sentry-test
 *
 * Endpoint de prueba para verificar que Sentry captura errores correctamente.
 */
export async function GET() {
  try {
    // Intentar verificar que Sentry está inicializado (v10+ API)
    const isInitialized = !!Sentry.getClient?.();
    
    // Forzar un error y capturarlo explícitamente con Sentry
    const testError = new Error(
      '[SENTRY_TEST] Error de prueba forzado para verificar que Sentry captura errores en el servidor.'
    );
    
    Sentry.captureException(testError, {
      tags: {
        test: 'sentry-verification',
        source: 'api-route',
      },
      extra: {
        timestamp: new Date().toISOString(),
        runtime: process.env.NEXT_RUNTIME,
        initialized: isInitialized,
      },
    });

    // También intentar flush para forzar el envío
    // Forzar el envío del evento antes de que termine la función serverless
    await Sentry.flush(5000);

    return NextResponse.json({
      ok: true,
      sentryInitialized: isInitialized,
      message: 'Error enviado a Sentry. Revisa tu dashboard.',
    });
  } catch (err) {
    console.error('[SENTRY_TEST] Error al enviar a Sentry:', err);
    return NextResponse.json(
      {
        ok: false,
        message: 'Error al enviar el test a Sentry',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}