/**
 * Tipos de Notificaciones
 * 
 * Define las interfaces y tipos para el sistema de notificaciones en tiempo real.
 */

export enum NotificationType {
  NEW_CHAPTER = 'NEW_CHAPTER',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_LIKE = 'NEW_LIKE',
  MENTION = 'MENTION',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  SYSTEM = 'SYSTEM',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  CLAN_INVITE = 'CLAN_INVITE',
  CLAN_JOIN_REQUEST = 'CLAN_JOIN_REQUEST',
  CLAN_JOIN_APPROVED = 'CLAN_JOIN_APPROVED',
  CLAN_JOIN_REJECTED = 'CLAN_JOIN_REJECTED',
}

export interface NotificationPayload {
  [NotificationType.NEW_CHAPTER]: {
    mangaId: string;
    mangaTitle: string;
    chapterId: string;
    chapterNumber: number;
    chapterTitle?: string;
    coverUrl?: string;
  };
  [NotificationType.NEW_COMMENT]: {
    mangaId: string;
    mangaTitle: string;
    chapterId?: string;
    commentId: string;
    commentText: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
  };
  [NotificationType.NEW_LIKE]: {
    mangaId?: string;
    chapterId?: string;
    commentId?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
  };
  [NotificationType.MENTION]: {
    mangaId?: string;
    chapterId?: string;
    commentId?: string;
    mentionerId: string;
    mentionerName: string;
    mentionerAvatar?: string;
    text: string;
  };
  [NotificationType.NEW_FOLLOWER]: {
    followerId: string;
    followerName: string;
    followerAvatar?: string;
  };
  [NotificationType.ACHIEVEMENT_UNLOCKED]: {
    achievementId: string;
    achievementName: string;
    achievementDescription: string;
    iconUrl?: string;
    xpReward?: number;
  };
  [NotificationType.SYSTEM]: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  };
  [NotificationType.STREAK_MILESTONE]: {
    days: number;
    label: string;
    xpBonus: number;
    freezesAwarded: number;
  };
  [NotificationType.CLAN_INVITE]: {
    clanId: string;
    clanName: string;
    clanEmblemUrl?: string;
    inviterId: string;
    inviterName: string;
    inviterAvatar?: string;
    invitationId: string;
  };
  [NotificationType.CLAN_JOIN_REQUEST]: {
    clanId: string;
    clanName: string;
    clanEmblemUrl?: string;
    requesterId: string;
    requesterName: string;
    requesterAvatar?: string;
    requestId: string;
    message?: string;
  };
  [NotificationType.CLAN_JOIN_APPROVED]: {
    clanId: string;
    clanName: string;
    clanEmblemUrl?: string;
    reviewerId: string;
    reviewerName: string;
    requestId: string;
  };
  [NotificationType.CLAN_JOIN_REJECTED]: {
    clanId: string;
    clanName: string;
    reviewerId: string;
    reviewerName: string;
    requestId: string;
    reason?: string;
  };
}

export type NotificationData<T extends NotificationType = NotificationType> = {
  type: T;
  payload: NotificationPayload[T];
};

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload[NotificationType];
  isRead: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    newChapter: boolean;
    newComment: boolean;
    newLike: boolean;
    mention: boolean;
    newFollower: boolean;
    achievement: boolean;
    system: boolean;
  };
  push: {
    newChapter: boolean;
    newComment: boolean;
    newLike: boolean;
    mention: boolean;
    newFollower: boolean;
    achievement: boolean;
    system: boolean;
  };
  webSocket: {
    newChapter: boolean;
    newComment: boolean;
    newLike: boolean;
    mention: boolean;
    newFollower: boolean;
    achievement: boolean;
    system: boolean;
  };
}

export interface NotificationCount {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationFilter {
  isRead?: boolean;
  types?: NotificationType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Eventos de Socket.IO para notificaciones
export enum NotificationEvents {
  // Client -> Server
  SUBSCRIBE = 'notification:subscribe',
  UNSUBSCRIBE = 'notification:unsubscribe',
  MARK_READ = 'notification:mark-read',
  MARK_ALL_READ = 'notification:mark-all-read',
  DELETE = 'notification:delete',
  GET_COUNT = 'notification:get-count',
  GET_NOTIFICATIONS = 'notification:get-notifications',

  // Server -> Client
  NEW_NOTIFICATION = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',
  COUNT_UPDATED = 'notification:count-updated',
  NOTIFICATIONS_LIST = 'notification:list',
  ERROR = 'notification:error',
}

export interface SocketNotificationPayload {
  notification: Notification;
}

export interface SocketCountPayload {
  total: number;
  unread: number;
}
