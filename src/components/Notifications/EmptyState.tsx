'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export function EmptyState({
  hasFilters = false,
  onClearFilters,
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Floating Bell */}
        <motion.div animate={floatingAnimation} className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
            <Bell className="h-12 w-12 text-primary/60" />
          </div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -left-4 -top-2"
          >
<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--info)]/20 backdrop-blur-sm">
        <Sparkles className="h-4 w-4 text-[var(--info)]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute -right-2 bottom-0"
          >
<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)]/20 backdrop-blur-sm">
        <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="max-w-md space-y-4"
      >
        <h3 className="text-2xl font-bold text-foreground">
          {hasFilters ? 'No hay notificaciones' : 'Sin notificaciones'}
        </h3>

        <p className="text-muted-foreground">
          {hasFilters
            ? 'No se encontraron notificaciones con los filtros aplicados. Intenta con otros filtros o elimina los actuales.'
            : 'Parece que no tienes notificaciones por el momento. ¡Explora nuevos mangas para descubrir historias increíbles!'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          {hasFilters ? (
            <Button
              variant="outline"
              size="lg"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
            >
              Limpiar filtros
            </Button>
          ) : (
            <>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push('/search_ia')}
                className="group w-full sm:w-auto"
              >
                <Compass className="mr-2 h-4 w-4" />
                Explorar mangas
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/search_ia')}
                className="w-full sm:w-auto"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar mangas
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Quick Stats (only when no filters) */}
      {!hasFilters && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-12 grid grid-cols-3 gap-6 sm:gap-12"
        >
          {[
            { icon: BookOpen, label: 'Descubre', value: 'Nuevos mangas' },
            { icon: Sparkles, label: 'Sigue', value: 'Tus favoritos' },
            { icon: Bell, label: 'Recibe', value: 'Notificaciones' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/50">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {item.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
