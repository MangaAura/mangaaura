'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto bg-[var(--error)]/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Error al confirmar la compra
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          No se pudo confirmar tu compra. Contacta a soporte si el cargo ya fue realizado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-2 rounded-lg font-medium bg-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-2 rounded-lg font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
          >
            Contactar soporte
          </Link>
        </div>
      </div>
    </div>
  );
}
