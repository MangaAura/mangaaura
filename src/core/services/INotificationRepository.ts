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
  | 'CROWDFUNDING_CONTRIBUTION'
  | 'STREAK_MILESTONE';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  linkUrl?: string | null;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationRecord>;
  findById(id: string): Promise<NotificationRecord | null>;
  findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<NotificationRecord[]>;
  findUnreadByUserId(userId: string, limit?: number): Promise<NotificationRecord[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(id: string): Promise<NotificationRecord | null>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string, userId?: string): Promise<boolean>;
  cleanupOld(days: number): Promise<number>;
  getStats(userId: string): Promise<{ total: number; unread: number; byType: Record<string, number> }>;
  createMany(data: CreateNotificationData[]): Promise<NotificationRecord[]>;
}

export interface IRealtimeNotificationService {
  emitToUser(userId: string, notification: Record<string, unknown>): void;
}

export interface IPushNotificationService {
  sendToUser(userId: string, data: { title: string; body: string; icon?: string; url?: string; tag?: string }): Promise<void>;
}
