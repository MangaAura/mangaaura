'use client';

import { Bell, BellOff, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      const perm = Notification.permission;
      setPermission(perm);

      if (perm === 'granted') {
        checkSubscription();
      }

      if (perm === 'default' && session?.user) {
        const timer = setTimeout(() => {
          if (!localStorage.getItem('push-notification-dismissed')) {
            setShowPrompt(true);
          }
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [session]);

  const subscribeToPush = async () => {
    try {
      const vapidRes = await fetch('/api/notifications/vapid-public-key');
      const { publicKey } = await vapidRes.json();

      if (!publicKey) {
        console.error('No VAPID public key available');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const keyBuffer = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBuffer.buffer as ArrayBuffer,
      });

      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setPermission('granted');
      setIsSubscribed(true);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setPermission('denied');
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        await fetch('/api/notifications/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  if (!isSupported || !session?.user || permission === 'denied') {
    return null;
  }

  // Show unsubscribe button when subscribed
  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-[var(--surface)] rounded-xl shadow-2xl p-4 w-80 border border-[var(--border)]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notificaciones activas</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Recibirás alertas de nuevos capítulos y actividad.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-[var(--surface-sunken)] rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={unsubscribeFromPush}
            className="w-full mt-3"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Desactivar notificaciones
          </Button>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[var(--surface)] rounded-xl shadow-2xl p-4 w-80 border border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
            <Bell className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notificaciones</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Recibe alertas cuando salgan nuevos capítulos de tus mangas favoritos.
            </p>
          </div>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-[var(--surface-sunken)] rounded-lg transition-colors cursor-pointer"
        aria-label="Descartar"
      >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={requestPermission}
            className="flex-1"
          >
            <Bell className="w-4 h-4 mr-2" />
            Activar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
          >
            <BellOff className="w-4 h-4 mr-2" />
            No
          </Button>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
