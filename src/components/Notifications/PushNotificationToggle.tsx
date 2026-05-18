'use client';

import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PushNotificationToggle({ 
  className,
  size = 'md' 
}: PushNotificationToggleProps) {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    error, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // Si no es soportado, mostrar tooltip
  if (!isSupported) {
    return (
      <div 
        className={cn(
          'relative group inline-block',
          className
        )}
        title="Notificaciones no soportadas"
      >
        <button 
          disabled
          className={cn(
            sizeClasses[size],
            'rounded-full bg-[var(--surface-sunken)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
          )}
        >
          <BellOff size={iconSizes[size]} />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--surface)] text-[var(--text-primary)] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Notificaciones no soportadas en este navegador
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[var(--surface)]" />
        </div>
      </div>
    );
  }

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <div className={cn('inline-block', className)}>
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            sizeClasses[size],
            'rounded-full',
            isSubscribed 
              ? 'bg-accent-blue/20 border-accent-blue text-accent-blue hover:bg-accent-blue/30' 
              : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
          )}
          title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        >
          {isLoading ? (
            <Loader2 size={iconSizes[size]} className="animate-spin" />
          ) : isSubscribed ? (
            <Bell size={iconSizes[size]} />
          ) : (
            <BellOff size={iconSizes[size]} />
          )}
        </Button>

        {/* Indicador de estado */}
        {isSubscribed && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--surface)]" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-[var(--error)]/90 text-[var(--text-inverse)] text-xs rounded-lg flex items-center gap-2 whitespace-nowrap z-50">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

export default PushNotificationToggle;
