/**
 * Servicio de Notificaciones
 * 
 * Gestiona la creación, lectura y limpieza de notificaciones en Prisma.
 * 
 * @module NotificationService
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { emitNotification } from '@/lib/socket';
import { sendPushNotification } from '@/lib/push-notifications';
import type { AchievementDefinition, Chapter, MangaSeries, Comment, User } from '@prisma/client';

// Tipos de notificación
export type NotificationType =
  | 'ACHIEVEMENT_UNLOCKED'
  | 'NEW_CHAPTER'
  | 'COMMENT_REPLY'
  | 'SPONSORSHIP_WON'
  | 'LEVEL_UP'
  | 'INK_COINS_RECEIVED'
  | 'SYSTEM'
  | 'MENTION'
  | 'TIP_RECEIVED'
  | 'CROWDFUNDING_CONTRIBUTION';

// DTO para crear notificación
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  linkUrl?: string;
}

// Re-export Notification type from Prisma
export type Notification = import('@prisma/client').Notification;

/**
 * Servicio de notificaciones
 */
export class NotificationService {
  private readonly pushEnabled: boolean;

  constructor(private readonly prismaClient: PrismaClient = prisma) {
    this.pushEnabled = process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false';
  }

  /**
   * Crear una notificación
   */
  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notification = await this.prismaClient.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        linkUrl: data.linkUrl,
      },
    });

    // Emitir notificación en tiempo real si está disponible
    try {
      const notificationPayload = {
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        userId: notification.userId,
        metadata: data.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      };
      emitNotification(data.userId, notificationPayload);
    } catch (error) {
      // Silenciar errores de socket
      console.info('[NotificationService] Socket emit failed (may be server-side)');
    }

    // Enviar notificación push si está habilitado
    if (this.pushEnabled && data.type !== 'SYSTEM') {
      sendPushNotification(data.userId, {
        title: data.title,
        body: data.message,
        url: data.linkUrl || '/',
        tag: data.type.toLowerCase(),
      }).catch(() => {
        // Errores de push no deben afectar la creación de la notificación
      });
    }

    return notification;
  }

  /**
   * Notificar logro desbloqueado
   */
  async notifyAchievementUnlocked(
    userId: string,
    achievement: AchievementDefinition
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: '🏆 ¡Logro Desbloqueado!',
      message: `Has desbloqueado: ${achievement.name}`,
      data: {
        achievementId: achievement.id,
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
      },
      imageUrl: achievement.iconUrl || undefined,
      linkUrl: '/achievements',
    });
  }

  /**
   * Notificar nuevo capítulo de manga seguido
   */
  async notifyNewChapter(
    userId: string,
    manga: MangaSeries,
    chapter: Chapter
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'NEW_CHAPTER',
      title: '📖 Nuevo Capítulo',
      message: `${manga.title} - Capítulo ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ''}`,
      data: {
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        coverUrl: manga.coverUrl,
      },
      imageUrl: manga.coverUrl || undefined,
      linkUrl: `/manga/${manga.slug}/chapter/${chapter.chapterNumber}`,
    });
  }

  /**
   * Notificar respuesta a comentario
   */
  async notifyCommentReply(
    userId: string,
    comment: Comment,
    replier: { id: string; username: string; displayName: string | null; avatarUrl: string | null },
    mangaTitle?: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'COMMENT_REPLY',
      title: '💬 Nueva Respuesta',
      message: `${replier.displayName || replier.username} respondió a tu comentario${mangaTitle ? ` en ${mangaTitle}` : ''}`,
      data: {
        commentId: comment.id,
        parentCommentId: comment.parentId,
        chapterId: comment.chapterId,
        replierId: replier.id,
        replierName: replier.displayName || replier.username,
        replierAvatar: replier.avatarUrl,
        content: comment.content.substring(0, 100),
      },
      imageUrl: replier.avatarUrl || undefined,
      linkUrl: `/chapter/${comment.chapterId}#comment-${comment.id}`,
    });
  }

  /**
   * Notificar patrocinio ganado
   */
  async notifySponsorshipWon(
    userId: string,
    chapter: Chapter,
    bidAmount: number,
    mangaTitle?: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'SPONSORSHIP_WON',
      title: '🎉 ¡Patrocinio Ganado!',
      message: `Has ganado el patrocinio del capítulo ${chapter.chapterNumber}${mangaTitle ? ` de ${mangaTitle}` : ''} con ${bidAmount} InkCoins`,
      data: {
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        bidAmount,
        mangaTitle,
      },
      linkUrl: `/chapter/${chapter.id}`,
    });
  }

  /**
   * Notificar subida de nivel
   */
  async notifyLevelUp(
    userId: string,
    oldLevel: number,
    newLevel: number
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'LEVEL_UP',
      title: '⭐ ¡Subida de Nivel!',
      message: `Has subido del nivel ${oldLevel} al nivel ${newLevel}. ¡Felicidades!`,
      data: {
        oldLevel,
        newLevel,
      },
      linkUrl: '/profile',
    });
  }

  /**
   * Notificar recepción de InkCoins
   */
  async notifyInkCoinsReceived(
    userId: string,
    amount: number,
    reason: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'INK_COINS_RECEIVED',
      title: '💰 InkCoins Recibidos',
      message: `Has recibido ${amount} InkCoins: ${reason}`,
      data: {
        amount,
        reason,
      },
      linkUrl: '/profile/wallet',
    });
  }

  /**
   * Notificar propina recibida
   */
  async notifyTipReceived(
    userId: string,
    amount: number,
    chapter: { id: string; chapterNumber: number; title?: string | null },
    sender: { id: string; username: string; displayName?: string | null },
    message?: string
  ): Promise<Notification> {
    const chapterTitle = chapter.title ? `: ${chapter.title}` : '';
    return this.createNotification({
      userId,
      type: 'TIP_RECEIVED',
      title: '💝 ¡Propina Recibida!',
      message: `${sender.displayName || sender.username} te envió ${amount} InkCoins por el Capítulo ${chapter.chapterNumber}${chapterTitle}`,
      data: {
        amount,
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        senderId: sender.id,
        senderName: sender.displayName || sender.username,
        message: message?.substring(0, 200),
      },
      linkUrl: `/chapter/${chapter.id}`,
    });
  }

  /**
   * Notificar contribución a crowdfunding
   */
  async notifyCrowdfundingContribution(
    userId: string,
    amount: number,
    chapter: { id: string; chapterNumber: number; title?: string | null },
    contributor: { id: string; username: string; displayName?: string | null },
    isAnonymous: boolean,
    newTotal: number,
    goalAmount: number
  ): Promise<Notification> {
    const chapterTitle = chapter.title ? `: ${chapter.title}` : '';
    const percentage = Math.min(Math.round((newTotal / goalAmount) * 100), 100);
    const goalReached = newTotal >= goalAmount;
    
    const contributorName = isAnonymous ? 'Alguien anónimo' : (contributor.displayName || contributor.username);
    
    return this.createNotification({
      userId,
      type: 'CROWDFUNDING_CONTRIBUTION',
      title: goalReached ? '🎉 ¡Meta de Crowdfunding Alcanzada!' : '💰 Nueva Contribución al Crowdfunding',
      message: goalReached
        ? `${contributorName} contribuyó ${amount} InkCoins y la meta fue alcanzada (${percentage}%) para el Capítulo ${chapter.chapterNumber}${chapterTitle}`
        : `${contributorName} contribuyó ${amount} InkCoins al crowdfunding del Capítulo ${chapter.chapterNumber}${chapterTitle} (${percentage}%)`,
      data: {
        amount,
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        contributorId: isAnonymous ? null : contributor.id,
        contributorName: isAnonymous ? 'Anónimo' : (contributor.displayName || contributor.username),
        isAnonymous,
        newTotal,
        goalAmount,
        percentage,
        goalReached,
      },
      linkUrl: `/chapter/${chapter.id}`,
    });
  }

  /**
   * Notificar mención en comentario
   */
  async notifyMention(
    userId: string,
    comment: Comment,
    mentioner: { id: string; username: string; displayName: string | null; avatarUrl: string | null },
    mangaTitle?: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'MENTION',
      title: '@ Mención',
      message: `${mentioner.displayName || mentioner.username} te mencionó${mangaTitle ? ` en ${mangaTitle}` : ''}`,
      data: {
        commentId: comment.id,
        chapterId: comment.chapterId,
        mentionerId: mentioner.id,
        mentionerName: mentioner.displayName || mentioner.username,
        mentionerAvatar: mentioner.avatarUrl,
        content: comment.content.substring(0, 100),
      },
      imageUrl: mentioner.avatarUrl || undefined,
      linkUrl: `/chapter/${comment.chapterId}#comment-${comment.id}`,
    });
  }

  /**
   * Buscar una notificación por ID
   */
  async findById(notificationId: string): Promise<Notification | null> {
    try {
      const notification = await this.prismaClient.notification.findUnique({
        where: { id: notificationId },
      });
      return notification as Notification | null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Notification[]> {
    const notifications = await this.prismaClient.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return notifications as Notification[];
}

/**
 * Obtener notificaciones no leídas
 */
async getUnreadNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const notifications = await this.prismaClient.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return notifications as Notification[];
}

  /**
   * Contar notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prismaClient.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<Notification | null> {
    try {
      const notification = await this.prismaClient.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return notification as Notification;
    } catch (error) {
      console.error('[NotificationService] Error marking as read:', error);
      return null;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prismaClient.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        const notification = await this.prismaClient.notification.findFirst({
          where: { id: notificationId, userId },
        });
        if (!notification) return false;
      }
      await this.prismaClient.notification.delete({
        where: { id: notificationId },
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Eliminar notificaciones antiguas (más de 30 días)
   */
  async cleanupOldNotifications(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prismaClient.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    console.info(`[NotificationService] Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    const [total, unread, byType] = await Promise.all([
      this.prismaClient.notification.count({ where: { userId } }),
      this.prismaClient.notification.count({ where: { userId, isRead: false } }),
      this.prismaClient.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      }),
    ]);

    const byTypeMap = byType.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.type] = curr._count.type;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byType: byTypeMap };
  }

  /**
   * Notificar a múltiples usuarios
   */
  async notifyMultiple(
    userIds: string[],
    notificationData: Omit<CreateNotificationDTO, 'userId'>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Procesar en lotes para evitar sobrecarga
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(userId =>
        this.createNotification({ ...notificationData, userId })
      );
      const results = await Promise.all(promises);
      notifications.push(...results);
    }

    return notifications;
  }
}

// Instancia singleton
export const notificationService = new NotificationService();

export default notificationService;
