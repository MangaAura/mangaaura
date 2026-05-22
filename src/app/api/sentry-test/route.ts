import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sentry-test
 *
 * Endpoint de prueba para verificar que Sentry captura errores correctamente.
 * Devuelve un error 500 intencionalmente.
 */
export async function GET() {
  // Lanza un error intencional para que Sentry lo capture
  throw new Error(
    '[SENTRY_TEST] Error de prueba forzado para verificar que Sentry captura errores en el servidor.'
  );

  // Never reached
  return NextResponse.json({ ok: true });
}
