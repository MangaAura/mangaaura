'use client';

import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const triggerClientError = useCallback(() => {
    try {
      throw new Error('[SENTRY_TEST] Error de prueba desde el cliente');
    } catch (err) {
      Sentry.captureException(err, {
        tags: { test: 'sentry-verification', source: 'client-page' },
      });
      alert('Error enviado a Sentry. Revisa el dashboard.');
    }
  }, []);

  const triggerUnhandledError = useCallback(() => {
    // This will be caught by Sentry's global error handler
    throw new Error('[SENTRY_TEST] Error NO manejado desde el cliente');
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="bg-[var(--surface-elevated)] rounded-2xl p-8 border border-[var(--border)]">
          <h1 className="text-2xl font-bold mb-2">🔍 Prueba de Sentry</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Haz clic en los botones para enviar errores de prueba a Sentry.
          </p>

          <div className="space-y-4">
            <button
              onClick={triggerClientError}
              className="w-full px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Enviar error controlado
            </button>

            <button
              onClick={triggerUnhandledError}
              className="w-full px-6 py-3 bg-[var(--error)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Lanzar error NO controlado
            </button>
          </div>

          <hr className="my-8 border-[var(--border)]" />

          <div className="text-left space-y-2 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">📋 Pasos:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Haz clic en un botón de arriba</li>
              <li>Ve a <a href="https://mangaaura.sentry.io/issues/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Sentry Issues</a></li>
              <li>Deberías ver el error aparecer</li>
            </ol>
          </div>

          <div className="mt-6 text-left space-y-2 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">🖥️ También prueba el endpoint:</p>
            <a
              href="/api/sentry-test"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline font-mono text-xs break-all"
            >
              /api/sentry-test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
