'use server';

/**
 * Push Notifications Service
 * 
 * Gestiona suscripciones Web Push y envío de notificaciones.
 * Usa web-push para enviar notificaciones push a los navegadores.
 */

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:noreply@inkverse.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

import type { WebPushSubscription, PushNotificationPayload } from '@/types/push';

/**
 * Guardar o actualizar suscripción de push
 */
export async function savePushSubscription(
  userId: string,
  subscription: WebPushSubscription
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      updatedAt: new Date(),
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

/**
 * Eliminar suscripción de push
 */
export async function deletePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });
}

/**
 * Enviar notificación push a un usuario
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  // Buscar suscripciones del usuario
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: false, error: 'No push subscriptions found' };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/badge-72x72.png',
    tag: payload.tag || 'default',
    url: payload.url || '/',
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [],
  });

  // Enviar a todas las suscripciones del usuario
  const results = await Promise.allSettled(
    subscriptions.map(async (sub: any) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error: any) {
        // Si falla, eliminar suscripción inválida
        if (error.statusCode === 404 || error.statusCode === 410) {
          await deletePushSubscription(sub.endpoint);
        }
        throw error;
      }
    })
  );

  const failed = results.filter((r: any) => r.status === 'rejected');
  const success = results.filter((r: any) => r.status === 'fulfilled');

  return {
    success: failed.length === 0,
    error: failed.length > 0 ? `${failed.length} de ${results.length} fallaron` : undefined,
  };
}

/**
 * Enviar notificación push a múltiples usuarios
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, payload))
  );

  const sent = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  const failed = results.length - sent;

  return { sent, failed };
}

/**
 * Obtener suscripciones de un usuario
 */
export async function getUserPushSubscriptions(userId: string): Promise<WebPushSubscription[]> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  return subscriptions.map((sub: any) => ({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  }));
}

/**
 * Verificar si un usuario tiene suscripciones push
 */
export async function hasPushSubscriptions(userId: string): Promise<boolean> {
  const count = await prisma.pushSubscription.count({
    where: { userId },
  });
  return count > 0;
}


