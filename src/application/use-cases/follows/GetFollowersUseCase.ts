import { DomainError } from '../../../core/errors/DomainError';
import { getFollowers } from '../../../core/services/FollowService';

export type FollowingType = 'USER' | 'MANGA';

export interface GetFollowersInputDTO {
  targetId: string;
  targetType: FollowingType;
  page?: number;
  limit?: number;
}

export interface GetFollowersOutputDTO {
  followers: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    followedAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}

export class GetFollowersUseCase {
  async execute(input: GetFollowersInputDTO): Promise<GetFollowersOutputDTO> {
    if (!input.targetId || input.targetId.trim().length === 0) {
      throw new ValidationError('ID de destino requerido');
    }
    if (!['USER', 'MANGA'].includes(input.targetType)) {
      throw new ValidationError('Tipo de destino inválido');
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(Math.max(1, input.limit ?? 20), 100);

    return getFollowers({
      followingId: input.targetId,
      followingType: input.targetType,
      page,
      limit,
    });
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
