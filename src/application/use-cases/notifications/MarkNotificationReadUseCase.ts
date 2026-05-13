import { DomainError } from '../../../core/errors/DomainError';
import type { Notification } from '../../../core/services/NotificationService';

export interface MarkNotificationReadInputDTO {
  userId: string;
  notificationId: string;
}

export interface MarkAllNotificationsReadInputDTO {
  userId: string;
}

export interface MarkNotificationReadOutputDTO {
  success: boolean;
  notificationId?: string;
  markedCount?: number;
  unreadCount: number;
}

export interface INotificationWriteRepository {
  markAsRead(notificationId: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  findById(notificationId: string): Promise<Notification | null>;
}

export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepo: INotificationWriteRepository
  ) {}

  async execute(input: MarkNotificationReadInputDTO): Promise<MarkNotificationReadOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (!input.notificationId || input.notificationId.trim().length === 0) {
      throw new ValidationError('ID de notificación requerido');
    }

    const notification = await this.notificationRepo.findById(input.notificationId);
    if (!notification) {
      throw new NotificationNotFoundError(input.notificationId);
    }

    if (notification.userId !== input.userId) {
      throw new UnauthorizedError('No autorizado para modificar esta notificación');
    }

    const updated = await this.notificationRepo.markAsRead(input.notificationId);
    if (!updated) {
      throw new (DomainError as any)('Error al marcar notificación como leída');
    }

    const unreadCount = await this.notificationRepo.getUnreadCount(input.userId);

    return {
      success: true,
      notificationId: input.notificationId,
      unreadCount,
    };
  }

  async executeMarkAll(input: MarkAllNotificationsReadInputDTO): Promise<MarkNotificationReadOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const markedCount = await this.notificationRepo.markAllAsRead(input.userId);

    return {
      success: true,
      markedCount,
      unreadCount: 0,
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

class NotificationNotFoundError extends DomainError {
  readonly code = 'NOTIFICATION_NOT_FOUND';
  readonly isOperational = true;
  constructor(notificationId: string) {
    super(`Notificación no encontrada: ${notificationId}`);
  }
}

class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
