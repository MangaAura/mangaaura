'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Crown, Home } from 'lucide-react';

export default function CreatorNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
          <Crown className="w-12 h-12 text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Página no encontrada
        </h1>

        <p className="text-[var(--text-secondary)] mb-8">
          La página de creador que buscas no existe. Puede que haya sido movida o el enlace sea incorrecto.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]">
            <Link href="/creator/dashboard">
              <Crown className="w-4 h-4 mr-2" />
              Panel de creador
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
