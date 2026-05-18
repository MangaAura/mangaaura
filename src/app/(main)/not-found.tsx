'use client';

import { motion } from 'framer-motion';
import { Home, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';


export default function MainNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-40 h-40 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
              404
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          Página no encontrada
        </h1>

        <p className="text-[var(--text-secondary)] text-lg mb-8">
          Lo sentimos, no pudimos encontrar la página que buscas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button size="lg" asChild className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:opacity-90">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]">
            <Link href="/browse">
              <BookOpen className="w-4 h-4 mr-2" />
              Explorar mangas
            </Link>
          </Button>
        </div>

        <Link href="/search" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors text-sm">
          <Search className="w-4 h-4" />
          Buscar en InkVerse
        </Link>
      </motion.div>
    </div>
  );
}
