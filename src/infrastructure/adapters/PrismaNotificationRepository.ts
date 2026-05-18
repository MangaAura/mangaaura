import type {
  INotificationRepository,
  IRealtimeNotificationService,
  IPushNotificationService,
  NotificationRecord,
  CreateNotificationData,
} from '@/core/services/INotificationRepository';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/push-notifications';
import { emitNotification } from '@/lib/socket';

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        linkUrl: data.linkUrl ?? null,
      },
    });
    return notification as unknown as NotificationRecord;
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    try {
      const notification = await prisma.notification.findUnique({ where: { id } });
      return notification as unknown as NotificationRecord | null;
    } catch {
      return null;
    }
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<NotificationRecord[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });
    return notifications as unknown as NotificationRecord[];
  }

  async findUnreadByUserId(userId: string, limit: number = 50): Promise<NotificationRecord[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return notifications as unknown as NotificationRecord[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string): Promise<NotificationRecord | null> {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return notification as unknown as NotificationRecord;
    } catch (error) {
      console.error('[PrismaNotificationRepository] Error marking as read:', error);
      return null;
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        const notification = await prisma.notification.findFirst({
          where: { id, userId },
        });
        if (!notification) return false;
      }
      await prisma.notification.delete({ where: { id } });
      return true;
    } catch (error) {
      console.error('[PrismaNotificationRepository] Error deleting notification:', error);
      return false;
    }
  }

  async cleanupOld(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    console.info(`[PrismaNotificationRepository] Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  async getStats(userId: string): Promise<{ total: number; unread: number; byType: Record<string, number> }> {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.groupBy({
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

  async createMany(data: CreateNotificationData[]): Promise<NotificationRecord[]> {
    const batchSize = 50;
    const results: NotificationRecord[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const promises = batch.map(d => this.create(d));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    return results;
  }
}

export class PushNotificationAdapter implements IPushNotificationService {
  private readonly pushEnabled: boolean;

  constructor() {
    this.pushEnabled = process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false';
  }

  async sendToUser(userId: string, data: { title: string; body: string; icon?: string; url?: string; tag?: string }): Promise<void> {
    if (!this.pushEnabled) return;

    await sendPushNotification(userId, {
      title: data.title,
      body: data.body,
      icon: data.icon,
      url: data.url || '/',
      tag: data.tag || 'default',
    }).catch(() => {});
  }
}

export class RealtimeNotificationAdapter implements IRealtimeNotificationService {
  emitToUser(userId: string, notification: Record<string, unknown>): void {
    try {
      emitNotification(userId, notification);
    } catch (error) {
      console.info('[RealtimeNotificationAdapter] Socket emit failed (may be server-side)');
    }
  }
}
