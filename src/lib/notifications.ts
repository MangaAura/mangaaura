import { prisma } from './prisma';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@inkverse.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

interface ChapterWithManga {
  id: string;
  chapterNumber: number;
  title: string | null;
  manga: {
    id: string;
    title: string;
    slug: string;
  };
  followers: Array<{
    userId: string;
  }>;
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  notification: PushNotification
): Promise<{ success: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) {
      return { success: false, reason: 'No subscription' };
    }

    const subscription = JSON.parse(user.pushSubscription);

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      tag: notification.tag || 'default',
      data: notification.data || {},
      actions: notification.actions || [],
    });

    await webpush.sendNotification(subscription, payload);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending push notification:', error);

    // If subscription is invalid, remove it
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null },
      });
      return { success: false, reason: 'Subscription expired' };
    }

    return { success: false, reason: 'Failed to send' };
  }
}

/**
 * Send notification when a new chapter is released
 */
export async function notifyNewChapter(
  mangaId: string,
  chapterNumber: number,
  chapterTitle: string
): Promise<{ total: number; sent: number }> {
  try {
    // Get manga and its followers
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (!manga) return { total: 0, sent: 0 };

    // Get followers
    const followers = await prisma.userManga.findMany({
      where: { 
        mangaId: mangaId,
        status: 'FOLLOWING'
      },
      select: { userId: true },
    });

    const notification = {
      title: `Nuevo capítulo de ${manga.title}`,
      body: `Capítulo ${chapterNumber}: ${chapterTitle}`,
      tag: `chapter-${mangaId}-${chapterNumber}`,
      data: {
        url: `/manga/${manga.slug}/chapter/${chapterNumber}`,
        mangaId,
        chapterNumber,
      },
      actions: [
        { action: 'read', title: 'Leer ahora' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    };

    // Send to all followers
    const results = await Promise.allSettled(
      followers.map((f) =>
        sendPushNotification(f.userId, notification)
      )
    );

    return {
      total: followers.length,
      sent: results.filter((r) => r.status === 'fulfilled' && r.value.success).length,
    };
  } catch (error) {
    console.error('Error notifying new chapter:', error);
    return { total: 0, sent: 0 };
  }
}

/**
 * Send notification for achievement unlock
 */
export async function notifyAchievement(
  userId: string,
  achievementName: string,
  achievementDescription: string
): Promise<{ success: boolean; reason?: string }> {
  return sendPushNotification(userId, {
    title: '🏆 ¡Logro desbloqueado!',
    body: `${achievementName}: ${achievementDescription}`,
    tag: 'achievement',
    icon: '/icons/achievement-192x192.png',
    data: {
      url: '/profile',
    },
    actions: [{ action: 'view', title: 'Ver perfil' }],
  });
}

/**
 * Send notification for tipped manga
 */
export async function notifyTip(
  userId: string,
  mangaTitle: string,
  tipAmount: number
): Promise<{ success: boolean; reason?: string }> {
  return sendPushNotification(userId, {
    title: '💰 ¡Recibiste una propina!',
    body: `Alguien te envió ${tipAmount} InkCoins por "${mangaTitle}"`,
    tag: 'tip',
    icon: '/icons/coins-192x192.png',
    data: {
      url: '/creator/dashboard',
    },
    actions: [{ action: 'view', title: 'Ver dashboard' }],
  });
}

/**
 * Send notification for clan invitation
 */
export async function notifyClanInvitation(
  userId: string,
  clanName: string,
  inviterName: string
): Promise<{ success: boolean; reason?: string }> {
  return sendPushNotification(userId, {
    title: '👥 Invitación de clan',
    body: `${inviterName} te invitó a unirte a "${clanName}"`,
    tag: 'clan-invite',
    icon: '/icons/clan-192x192.png',
    data: {
      url: '/community/clans',
    },
    actions: [
      { action: 'accept', title: 'Aceptar' },
      { action: 'decline', title: 'Rechazar' },
    ],
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return false;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

// Notification emitter for server-sent events
export const notificationEmitter = {
  emit: (event: string, data: unknown) => {
    // Implementation would go here
    console.log(`[NotificationEmitter] ${event}:`, data);
  },
};
