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
          console.log('SW registrado:', reg);
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
          console.log('Error registrando SW:', err);
        });

      // Check for updates periodically
      const interval = setInterval(() => {
        registration?.update();
      }, 60000); // Check every minute

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
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="font-medium text-sm">Nueva versión disponible</p>
          <p className="text-xs text-slate-400">Actualiza para obtener las últimas mejoras</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpdate}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
