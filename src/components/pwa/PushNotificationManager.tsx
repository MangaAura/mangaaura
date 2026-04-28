'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Bell, BellOff, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Show prompt after 10 seconds if not decided
      if (Notification.permission === 'default' && session?.user) {
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setPermission('granted');
      setShowPrompt(false);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setPermission('denied');
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

  if (permission === 'granted') {
    return null; // Already subscribed, show nothing
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 rounded-xl shadow-2xl p-4 w-80 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-white">Notificaciones</h3>
            <p className="text-xs text-slate-400 mt-1">
              Recibe alertas cuando salgan nuevos capítulos de tus mangas favoritos.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={requestPermission}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
          >
            <Bell className="w-4 h-4 mr-2" />
            Activar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <BellOff className="w-4 h-4 mr-2" />
            No
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
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
