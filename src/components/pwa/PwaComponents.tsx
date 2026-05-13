'use client';

import dynamic from 'next/dynamic';

const InstallPrompt = dynamic(() => import('./InstallPrompt').then((m) => m.InstallPrompt), { ssr: false });
const OfflineIndicator = dynamic(() => import('./OfflineIndicator').then((m) => m.OfflineIndicator), { ssr: false });
const ServiceWorkerRegistration = dynamic(() => import('./ServiceWorkerRegistration').then((m) => m.ServiceWorkerRegistration), { ssr: false });
const PushNotificationManager = dynamic(() => import('./PushNotificationManager').then((m) => m.PushNotificationManager), { ssr: false });

export function PwaComponents() {
  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
      <ServiceWorkerRegistration />
      <PushNotificationManager />
    </>
  );
}
