import { DomainError } from '../../../core/errors/DomainError';
import { removeMangaFromCollection } from '../../../core/services/CollectionService';

export interface RemoveItemFromCollectionInputDTO {
  collectionId: string;
  userId: string;
  mangaId: string;
}

export interface RemoveItemFromCollectionOutputDTO {
  success: boolean;
}

export class RemoveItemFromCollectionUseCase {
  async execute(input: RemoveItemFromCollectionInputDTO): Promise<RemoveItemFromCollectionOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }
    if (!input.mangaId || input.mangaId.trim().length === 0) {
      throw new ValidationError('ID de manga requerido');
    }

    const result = await removeMangaFromCollection({
      collectionId: input.collectionId,
      userId: input.userId,
      mangaId: input.mangaId,
    });

    if (!result.success) {
      throw new ServiceError(result.error || 'Error al eliminar manga');
    }

    return { success: true };
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
