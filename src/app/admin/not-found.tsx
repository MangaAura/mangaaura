'use client';

import { Shield, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function AdminNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Shield className="w-12 h-12 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Página no encontrada
        </h1>

        <p className="text-[var(--text-secondary)] mb-8">
          La página de administración que buscas no existe. Verifica que el enlace sea correcto.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]">
            <Link href="/admin">
              <Home className="w-4 h-4 mr-2" />
              Panel de admin
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="border-[var(--border)] text-[var(--text-primary)]">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
