import { DomainError } from '../../../core/errors/DomainError';
import { toggleFollow } from '../../../core/services/FollowService';

export type FollowingType = 'USER' | 'MANGA';

export interface ToggleFollowInputDTO {
  followerId: string;
  targetId: string;
  targetType: FollowingType;
}

export interface ToggleFollowOutputDTO {
  success: boolean;
  isFollowing: boolean;
  message: string;
}

export class ToggleFollowUseCase {
  async execute(input: ToggleFollowInputDTO): Promise<ToggleFollowOutputDTO> {
    if (!input.followerId || input.followerId.trim().length === 0) {
      throw new ValidationError('ID de seguidor requerido');
    }
    if (!input.targetId || input.targetId.trim().length === 0) {
      throw new ValidationError('ID de destino requerido');
    }
    if (!['USER', 'MANGA'].includes(input.targetType)) {
      throw new ValidationError('Tipo de destino inválido');
    }
    if (input.targetType === 'USER' && input.targetId === input.followerId) {
      throw new ValidationError('No puedes seguirte a ti mismo');
    }

    const result = await toggleFollow({
      followerId: input.followerId,
      followingId: input.targetId,
      followingType: input.targetType,
    });

    return {
      success: result.success,
      isFollowing: result.isFollowing,
      message: result.isFollowing
        ? (input.targetType === 'USER' ? 'Ahora sigues al usuario' : 'Ahora sigues el manga')
        : (input.targetType === 'USER' ? 'Dejaste de seguir al usuario' : 'Dejaste de seguir el manga'),
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
