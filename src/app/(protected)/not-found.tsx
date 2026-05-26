'use client';

import { motion } from 'framer-motion';
import { Home, Library, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { NoIndex } from '@/components/SEO/NoIndex';
import { useT } from '@/i18n';

export default function AppNotFoundPage() {
  const t = useT();

  return (
    <>
      <NoIndex />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center">
          <span className="text-6xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          {t('errors.notFound')}
        </h1>

        <p className="text-[var(--text-secondary)] mb-8">
          La página que buscas no existe en tu panel personal. Puede que haya sido movida o que el enlace sea incorrecto.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button size="lg" asChild className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:opacity-90">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]">
            <Link href="/library">
              <Library className="w-4 h-4 mr-2" />
              Mi biblioteca
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto">
          <Link href="/explore" className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)]/50 hover:bg-[var(--surface-sunken)] transition-colors border border-[var(--border)]">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <p className="text-[var(--text-primary)] font-medium text-sm">Explorar mangas</p>
              <p className="text-[var(--text-secondary)] text-xs">Descubre nuevas historias</p>
            </div>
          </Link>
          <Link href="/explore" className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)]/50 hover:bg-[var(--surface-sunken)] transition-colors border border-[var(--border)]">
            <ArrowLeft className="w-5 h-5 text-[var(--accent-purple)]" />
            <div>
              <p className="text-[var(--text-primary)] font-medium text-sm">Volver</p>
              <p className="text-[var(--text-secondary)] text-xs">Regresa a la página anterior</p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-[var(--text-tertiary)] text-sm">
          ¿Crees que esto es un error?{' '}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">
            Contacta con soporte
          </Link>
        </p>
      </motion.div>
    </div>
    </>
  );
}
