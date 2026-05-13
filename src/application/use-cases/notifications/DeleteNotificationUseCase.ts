import { DomainError } from '../../../core/errors/DomainError';
import type { Notification } from '../../../core/services/NotificationService';

export interface DeleteNotificationInputDTO {
  userId: string;
  notificationId: string;
}

export interface DeleteNotificationOutputDTO {
  success: boolean;
  notificationId: string;
}

export interface INotificationDeleteRepository {
  findById(notificationId: string): Promise<Notification | null>;
  deleteNotification(notificationId: string, userId?: string): Promise<boolean>;
}

export class DeleteNotificationUseCase {
  constructor(
    private readonly notificationRepo: INotificationDeleteRepository
  ) {}

  async execute(input: DeleteNotificationInputDTO): Promise<DeleteNotificationOutputDTO> {
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
      throw new UnauthorizedError('No autorizado para eliminar esta notificación');
    }

    const deleted = await this.notificationRepo.deleteNotification(input.notificationId, input.userId);
    if (!deleted) {
      throw new (DomainError as any)('Error al eliminar la notificación');
    }

    return {
      success: true,
      notificationId: input.notificationId,
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
