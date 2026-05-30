'use client';

import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const t = useT();

  useEffect(() => {
    // Initial state
    if (isOnline !== navigator.onLine) setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300',
        isOnline
? 'bg-[var(--success)] text-[var(--text-inverse)]'
        : 'bg-[var(--warning)] text-[var(--text-inverse)]'
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">{t('offline.reconnecting')}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">{t('offline.noConnection')}</span>
          </>
        )}
      </div>
    </div>
  );
}
