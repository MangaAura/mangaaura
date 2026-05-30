'use client';

import { motion } from 'framer-motion';
import { Search, Home, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { NoIndex } from '@/components/SEO/NoIndex';
import { Button } from '@/components/ui/Button';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
} as any;

const childVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
} as any;

const floatVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
} as any;

export default function NotFoundPage() {
  return (
    <>
      <NoIndex />
      <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--primary-subtle)]/30 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center"
      >
        {/* 404 Illustration */}
        <motion.div variants={floatVariants} className="mb-8 relative">
          <div className="w-48 h-48 mx-auto relative">
            {/* Background circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
            
            {/* 404 Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                404
              </span>
            </div>
            
            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0, rotate: -12, x: -20 }}
              animate={{ opacity: 1, rotate: 12, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center border border-[var(--border)]"
            >
              <span className="text-2xl">❓</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, rotate: 6, x: 20 }}
              animate={{ opacity: 1, rotate: -6, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-2 -left-6 w-16 h-16 bg-[var(--surface-sunken)] rounded-lg flex items-center justify-center border border-[var(--border)]"
            >
              <span className="text-3xl">📚</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={childVariants} className="text-4xl font-bold text-[var(--text-primary)] mb-4">
          Página no encontrada
        </motion.h1>

        {/* Description */}
        <motion.p variants={childVariants} className="text-[var(--text-secondary)] text-lg mb-2">
          Lo sentimos, no pudimos encontrar la página que buscas.
        </motion.p>
        <motion.p variants={childVariants} className="text-[var(--text-tertiary)] mb-8">
          Es posible que haya sido movida, eliminada o que nunca existió.
        </motion.p>

        {/* Suggestions */}
        <motion.div variants={childVariants} className="bg-[var(--surface)]/50 rounded-xl p-6 mb-8 border border-[var(--border)]">
          <h2 className="text-[var(--text-primary)] font-semibold mb-4 flex items-center justify-center gap-2">
            <Search className="w-5 h-5 text-[var(--primary)]" />
            ¿Qué puedes hacer?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <Link
              href="/explore"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/30 transition-colors">
                <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-medium">Explorar mangas</p>
                <p className="text-[var(--text-secondary)] text-sm">Descubre nuevas historias</p>
              </div>
            </Link>

            <Link
              href="/explore"
              className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-sunken)]/50 hover:bg-[var(--surface-sunken)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-purple)]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent-purple)]/30 transition-colors">
                <Search className="w-5 h-5 text-[var(--accent-purple)]" />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-medium">Buscar</p>
                <p className="text-[var(--text-secondary)] text-sm">Encuentra lo que buscas</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={childVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:opacity-90"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
          >
            <Link href="/explore">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Explorar mangas
            </Link>
          </Button>
        </motion.div>

        {/* Help */}
        <motion.p variants={childVariants} className="mt-8 text-[var(--text-tertiary)] text-sm">
          ¿Crees que esto es un error?{' '}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">
            Contacta con soporte
          </Link>
        </motion.p>
      </motion.div>
    </main>
    </>
  );
}
