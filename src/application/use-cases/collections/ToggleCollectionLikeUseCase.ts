import { DomainError } from '../../../core/errors/DomainError';
import { toggleLikeCollection } from '../../../core/services/CollectionService';

export interface ToggleCollectionLikeInputDTO {
  collectionId: string;
  userId: string;
  isLiked?: boolean;
}

export interface ToggleCollectionLikeOutputDTO {
  success: boolean;
  isLiked?: boolean;
}

export class ToggleCollectionLikeUseCase {
  async execute(input: ToggleCollectionLikeInputDTO): Promise<ToggleCollectionLikeOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const result = await toggleLikeCollection({
      collectionId: input.collectionId,
      userId: input.userId,
      isLiked: input.isLiked,
    });

    if (!result.success) {
      throw new ServiceError(result.error || 'Error al cambiar like');
    }

    return { success: true, isLiked: result.isLiked };
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class ServiceError extends DomainError {
  readonly code = 'SERVICE_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
