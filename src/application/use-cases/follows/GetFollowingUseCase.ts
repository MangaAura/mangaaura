import { DomainError } from '../../../core/errors/DomainError';
import { getFollowing } from '../../../core/services/FollowService';

export type FollowingType = 'USER' | 'MANGA';

export interface GetFollowingInputDTO {
  userId: string;
  followingType?: FollowingType;
  page?: number;
  limit?: number;
}

export interface GetFollowingOutputDTO {
  following: Array<{
    id: string;
    type: FollowingType;
    name: string;
    avatarUrl: string | null;
    followedAt: Date;
    metadata?: Record<string, unknown>;
  }>;
  total: number;
  hasMore: boolean;
}

export class GetFollowingUseCase {
  async execute(input: GetFollowingInputDTO): Promise<GetFollowingOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(Math.max(1, input.limit ?? 20), 100);

    return getFollowing({
      followerId: input.userId,
      followingType: input.followingType,
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
