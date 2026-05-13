/**
 * @deprecated This module is deprecated. All push notification functionality
 * has been consolidated into `@/lib/push-notifications` using the Prisma
 * `PushSubscription` model. In-app notification creation is handled by
 * `NotificationService` in `@/core/services/NotificationService`.
 */
import { prisma } from './prisma';
import * as pushNotifications from './push-notifications';

// Notification emitter for server-sent events
export const notificationEmitter = {
  emit: (_event: string, _data: unknown) => {
    // Implementation would go here
  },
};

export async function sendPushNotification(
  userId: string,
  notification: { title: string; body: string; icon?: string; badge?: string; tag?: string; data?: Record<string, unknown>; actions?: Array<{ action: string; title: string }> }
): Promise<{ success: boolean; reason?: string }> {
  console.warn('[notifications.ts] DEPRECATED: Use pushNotifications.sendPushNotification from @/lib/push-notifications instead');
  const result = await pushNotifications.sendPushNotification(userId, {
    title: notification.title,
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: notification.tag,
    url: (notification.data?.url as string) || '/',
    actions: notification.actions,
  });
  return { success: result.success, reason: result.error };
}

export async function notifyNewChapter(
  mangaId: string,
  chapterNumber: number,
  chapterTitle: string
): Promise<{ total: number; sent: number }> {
  console.warn('[notifications.ts] DEPRECATED: Use notificationService from @/core/services/NotificationService instead');
  try {
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, title: true, slug: true },
    });
    if (!manga) return { total: 0, sent: 0 };

    const followers = await prisma.userManga.findMany({
      where: { mangaId, status: 'FOLLOWING' },
      select: { userId: true },
    });

    const payload = {
      title: `Nuevo capítulo de ${manga.title}`,
      body: `Capítulo ${chapterNumber}: ${chapterTitle}`,
      url: `/manga/${manga.slug}/chapter/${chapterNumber}`,
      tag: `chapter-${mangaId}-${chapterNumber}`,
      actions: [
        { action: 'read', title: 'Leer ahora' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    };

    const result = await pushNotifications.sendBulkPushNotifications(
      followers.map(f => f.userId),
      payload
    );

    return { total: followers.length, sent: result.sent };
  } catch (error) {
    console.error('Error notifying new chapter:', error);
    return { total: 0, sent: 0 };
  }
}

export async function notifyAchievement(
  userId: string,
  achievementName: string,
  achievementDescription: string
): Promise<{ success: boolean; reason?: string }> {
  console.warn('[notifications.ts] DEPRECATED: Use notificationService.notifyAchievementUnlocked from @/core/services/NotificationService instead');
  const result = await pushNotifications.sendPushNotification(userId, {
    title: '🏆 ¡Logro desbloqueado!',
    body: `${achievementName}: ${achievementDescription}`,
    tag: 'achievement',
    icon: '/icons/achievement-192x192.png',
    url: '/profile',
    actions: [{ action: 'view', title: 'Ver perfil' }],
  });
  return { success: result.success, reason: result.error };
}

export async function notifyTip(
  userId: string,
  mangaTitle: string,
  tipAmount: number
): Promise<{ success: boolean; reason?: string }> {
  console.warn('[notifications.ts] DEPRECATED: Use notificationService.notifyTipReceived from @/core/services/NotificationService instead');
  const result = await pushNotifications.sendPushNotification(userId, {
    title: '💰 ¡Recibiste una propina!',
    body: `Alguien te envió ${tipAmount} InkCoins por "${mangaTitle}"`,
    tag: 'tip',
    icon: '/icons/coins-192x192.png',
    url: '/creator/dashboard',
    actions: [{ action: 'view', title: 'Ver dashboard' }],
  });
  return { success: result.success, reason: result.error };
}

export async function notifyClanInvitation(
  userId: string,
  clanName: string,
  inviterName: string
): Promise<{ success: boolean; reason?: string }> {
  console.warn('[notifications.ts] DEPRECATED: Use notificationService instead');
  const result = await pushNotifications.sendPushNotification(userId, {
    title: '👥 Invitación de clan',
    body: `${inviterName} te invitó a unirte a "${clanName}"`,
    tag: 'clan-invite',
    icon: '/icons/clan-192x192.png',
    url: '/community/clans',
    actions: [
      { action: 'accept', title: 'Aceptar' },
      { action: 'decline', title: 'Rechazar' },
    ],
  });
  return { success: result.success, reason: result.error };
}

export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  console.warn('[notifications.ts] DEPRECATED: Use notificationService.deleteNotification from @/core/services/NotificationService instead');
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) return false;
  await prisma.notification.delete({ where: { id: notificationId } });
  return true;
}
