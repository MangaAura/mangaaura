'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
      .then((reg) => {
        console.info('[SW] Registered');
        setRegistration(reg);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });

      const interval = setInterval(() => {
        registration?.update();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [registration]);

  const handleUpdate = () => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[var(--surface)] text-[var(--text-primary)] rounded-xl shadow-2xl p-4 flex items-center gap-4 border border-[var(--border)]">
        <div className="flex-1">
          <p className="font-medium text-sm">Nueva versión disponible</p>
          <p className="text-xs text-[var(--text-secondary)]">Actualiza para obtener las últimas mejoras</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
