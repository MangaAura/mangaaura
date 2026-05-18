'use client';

import { LogIn, Home } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function AuthNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
          <span className="text-5xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
            ?
          </span>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Página no encontrada
        </h1>

        <p className="text-[var(--text-secondary)] mb-8">
          La página de autenticación que buscas no existe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]">
            <Link href="/auth/login">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar sesión
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="border-[var(--border)] text-[var(--text-primary)]">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
