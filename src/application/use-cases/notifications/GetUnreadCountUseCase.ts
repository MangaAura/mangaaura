import { DomainError } from '../../../core/errors/DomainError';

export interface GetUnreadCountInputDTO {
  userId: string;
}

export interface GetUnreadCountOutputDTO {
  unread: number;
  total: number;
  byType: Record<string, number>;
}

export interface IUnreadStatsRepository {
  getUnreadCount(userId: string): Promise<number>;
  getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }>;
}

export class GetUnreadCountUseCase {
  constructor(
    private readonly statsRepo: IUnreadStatsRepository
  ) {}

  async execute(input: GetUnreadCountInputDTO): Promise<GetUnreadCountOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const stats = await this.statsRepo.getNotificationStats(input.userId);

    return {
      unread: stats.unread,
      total: stats.total,
      byType: stats.byType,
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
