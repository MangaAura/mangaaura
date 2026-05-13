import { DomainError } from '../../../core/errors/DomainError';
import type { Notification } from '../../../core/services/NotificationService';

export interface GetNotificationsInputDTO {
  userId: string;
  limit?: number;
  offset?: number;
  type?: string;
  isRead?: boolean;
  includeRead?: boolean;
}

export interface GetNotificationsOutputDTO {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface INotificationQueryRepository {
  getUserNotifications(userId: string, limit: number, offset: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
}

export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepo: INotificationQueryRepository
  ) {}

  async execute(input: GetNotificationsInputDTO): Promise<GetNotificationsOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const limit = Math.min(input.limit ?? 20, 100);
    const offset = input.offset ?? 0;

    let notifications = await this.notificationRepo.getUserNotifications(
      input.userId,
      limit,
      offset
    );

    if (input.type) {
      notifications = notifications.filter(n => n.type === input.type);
    }

    if (input.isRead !== undefined) {
      notifications = notifications.filter(n => n.isRead === input.isRead);
    } else if (input.includeRead === false) {
      notifications = notifications.filter(n => !n.isRead);
    }

    const unreadCount = await this.notificationRepo.getUnreadCount(input.userId);

    return {
      notifications,
      total: notifications.length,
      unreadCount,
      hasMore: notifications.length === limit,
    };
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
