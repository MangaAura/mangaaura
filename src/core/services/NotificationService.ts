import type {
  INotificationRepository,
  IRealtimeNotificationService,
  IPushNotificationService,
  NotificationRecord,
} from './INotificationRepository';

export type NotificationType =
  | 'ACHIEVEMENT_UNLOCKED'
  | 'NEW_CHAPTER'
  | 'COMMENT_REPLY'
  | 'SPONSORSHIP_WON'
  | 'LEVEL_UP'
  | 'AURA_RECEIVED'
  | 'SYSTEM'
  | 'MENTION'
  | 'TIP_RECEIVED'
  | 'CROWDFUNDING_CONTRIBUTION'
  | 'STREAK_MILESTONE';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  linkUrl?: string;
}

export type Notification = NotificationRecord;

export class NotificationService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly pushService?: IPushNotificationService,
    private readonly realtimeService?: IRealtimeNotificationService
  ) {}

  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notification = await this.notificationRepo.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data as Record<string, unknown> | null | undefined,
      linkUrl: data.linkUrl,
    });

    if (this.realtimeService) {
      this.realtimeService.emitToUser(data.userId, {
        id: notification.id,
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        metadata: data.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    }

    if (this.pushService && data.type !== 'SYSTEM') {
      this.pushService.sendToUser(data.userId, {
        title: data.title,
        body: data.message,
        url: data.linkUrl || '/',
        tag: data.type.toLowerCase(),
      });
    }

    return notification;
  }

  async notifyAchievementUnlocked(
    userId: string,
    achievement: { id: string; badgeId: string; name: string; description: string; xpReward: number; iconUrl?: string | null; }
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

  async notifyNewChapter(
    userId: string,
    manga: { id: string; title: string; slug: string; coverUrl?: string | null; },
    chapter: { id: string; chapterNumber: number; title?: string | null; }
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

  async notifyCommentReply(
    userId: string,
    comment: { id: string; parentId?: string | null; chapterId?: string | null; content: string; },
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

  async notifySponsorshipWon(
    userId: string,
    chapter: { id: string; chapterNumber: number; },
    bidAmount: number,
    mangaTitle?: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'SPONSORSHIP_WON',
      title: '🎉 ¡Patrocinio Ganado!',
      message: `Has ganado el patrocinio del capítulo ${chapter.chapterNumber}${mangaTitle ? ` de ${mangaTitle}` : ''} con ${bidAmount} Aura`,
      data: {
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        bidAmount,
        mangaTitle,
      },
      linkUrl: `/chapter/${chapter.id}`,
    });
  }

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

  async notifyAuraReceived(
    userId: string,
    amount: number,
    reason: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: 'AURA_RECEIVED',
      title: '💰 Aura Recibidos',
      message: `Has recibido ${amount} Aura: ${reason}`,
      data: {
        amount,
        reason,
      },
      linkUrl: '/profile/wallet',
    });
  }

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
      message: `${sender.displayName || sender.username} te envió ${amount} Aura por el Capítulo ${chapter.chapterNumber}${chapterTitle}`,
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
        ? `${contributorName} contribuyó ${amount} Aura y la meta fue alcanzada (${percentage}%) para el Capítulo ${chapter.chapterNumber}${chapterTitle}`
        : `${contributorName} contribuyó ${amount} Aura al crowdfunding del Capítulo ${chapter.chapterNumber}${chapterTitle} (${percentage}%)`,
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

  async notifyMention(
    userId: string,
    comment: { id: string; chapterId?: string | null; content: string; },
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

  async findById(notificationId: string): Promise<Notification | null> {
    return this.notificationRepo.findById(notificationId);
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Notification[]> {
    return this.notificationRepo.findByUserId(userId, { limit, offset });
  }

  async getUnreadNotifications(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    return this.notificationRepo.findUnreadByUserId(userId, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.notificationRepo.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepo.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId?: string): Promise<boolean> {
    return this.notificationRepo.delete(notificationId, userId);
  }

  async cleanupOldNotifications(days: number = 30): Promise<number> {
    return this.notificationRepo.cleanupOld(days);
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    return this.notificationRepo.getStats(userId);
  }

  async notifyMultiple(
    userIds: string[],
    notificationData: Omit<CreateNotificationDTO, 'userId'>
  ): Promise<Notification[]> {
    const dataList = userIds.map(userId => ({
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data as Record<string, unknown> | null | undefined,
      linkUrl: notificationData.linkUrl,
    }));

    return this.notificationRepo.createMany(dataList);
  }
}

export let notificationService: NotificationService | undefined;

export function initializeNotificationService(
  repo: INotificationRepository,
  pushService?: IPushNotificationService,
  realtimeService?: IRealtimeNotificationService
): NotificationService {
  const service = new NotificationService(repo, pushService, realtimeService);
  notificationService = service;
  return service;
}

export async function getNotificationService(): Promise<NotificationService> {
  if (notificationService) return notificationService;
  const { PrismaNotificationRepository, PushNotificationAdapter, RealtimeNotificationAdapter } = await import('@/infrastructure/adapters/PrismaNotificationRepository');
  return initializeNotificationService(
    new PrismaNotificationRepository(),
    new PushNotificationAdapter(),
    new RealtimeNotificationAdapter()
  );
}

export default notificationService;
