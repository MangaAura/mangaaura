'use client';

import { motion } from 'framer-motion';
import { Search, Bell, Users, MessageSquare, AlertTriangle, Library } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

import { Button } from './Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  preset?: 'default' | 'empty' | 'error' | 'search' | 'library' | 'custom';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  preset,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const presets: Record<string, { icon: ReactNode; title: string; description: string }> = {
    empty: { icon: <Library className="w-8 h-8" />, title: 'Sin contenido', description: 'No hay nada que mostrar aquí' },
    error: { icon: <AlertTriangle className="w-8 h-8 text-red-500" />, title: 'Algo salió mal', description: 'Hubo un error al cargar el contenido.' },
    search: { icon: <Search className="w-8 h-8" />, title: 'No se encontraron resultados', description: 'Intenta con otros términos de búsqueda.' },
    library: { icon: <Library className="w-8 h-8" />, title: 'Tu biblioteca está vacía', description: 'Comienza a seguir mangas para verlos aquí.' },
  };
  const resolved = preset ? presets[preset] : null;
  const finalIcon = icon ?? resolved?.icon;
  const finalTitle = title ?? resolved?.title ?? 'Sin contenido';
  const finalDescription = description ?? resolved?.description ?? 'No hay nada que mostrar aquí';
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12 text-2xl',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16 text-3xl',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20 text-4xl',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizes[size].container,
        className
      )}
    >
      {finalIcon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className={cn(
            'mb-4 bg-[var(--surface-sunken)]/50 rounded-2xl flex items-center justify-center text-[var(--text-muted)]',
            sizes[size].icon
          )}
        >
          {finalIcon}
        </motion.div>
      )}
      <h2 className={cn('font-semibold text-[var(--text-primary)] mb-2', sizes[size].title)}>
        {finalTitle}
      </h2>

      {finalDescription && (
        <p className={cn('text-[var(--text-secondary)] max-w-md mb-6', sizes[size].description)}>
          {finalDescription}
        </p>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              size={size === 'sm' ? 'sm' : 'default'}
              className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
              {...(action.href ? { asChild: true } : { onClick: action.onClick })}
            >
              {action.href ? (
                <Link href={action.href}>{action.label}</Link>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
              className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
              {...(secondaryAction.href ? { asChild: true } : { onClick: secondaryAction.onClick })}
            >
              {secondaryAction.href ? (
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export function EmptyLibrary() {
  return (
    <EmptyState
      icon={<Library className="w-8 h-8" />}
      title="Tu biblioteca está vacía"
      description="Comienza a seguir mangas para verlos aquí. Tu biblioteca se sincronizará automáticamente."
      action={{ label: 'Explorar mangas', href: '/explore' }}
      secondaryAction={{ label: 'Ver rankings', href: '/rankings' }}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title="No se encontraron resultados"
      description={`No encontramos mangas que coincidan con "${query}". Intenta con otros términos.`}
      action={{ label: 'Ver todos los mangas', href: '/explore' }}
      secondaryAction={{ label: 'Borrar búsqueda', href: '/explore' }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Bell className="w-8 h-8" />}
      title="Sin notificaciones"
      description="No tienes notificaciones nuevas. Te avisaremos cuando haya novedades."
      size="sm"
    />
  );
}

export function EmptyFollowing() {
  return (
    <EmptyState
      icon={<Users className="w-8 h-8" />}
      title="No sigues a nadie"
      description="Sigue a tus creadores favoritos para ver sus actualizaciones en tu feed."
      action={{ label: 'Descubrir creadores', href: '/explore' }}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={<MessageSquare className="w-8 h-8" />}
      title="Sin mensajes"
      description="Tus conversaciones aparecerán aquí. Inicia una conversación con alguien."
      action={{ label: 'Nuevo mensaje', href: '/messages/new' }}
    />
  );
}

export function ErrorState({
  onRetry,
  message = 'Hubo un error al cargar el contenido.',
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
      title="Algo salió mal"
      description={message}
      action={
        onRetry
          ? { label: 'Intentar de nuevo', onClick: onRetry }
          : undefined
      }
    />
  );
}
