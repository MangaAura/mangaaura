import { DomainError } from '../../../core/errors/DomainError';
import { addMangaToCollection } from '../../../core/services/CollectionService';

export interface AddItemToCollectionInputDTO {
  collectionId: string;
  userId: string;
  mangaId: string;
}

export interface AddItemToCollectionOutputDTO {
  success: boolean;
}

export class AddItemToCollectionUseCase {
  async execute(input: AddItemToCollectionInputDTO): Promise<AddItemToCollectionOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }
    if (!input.mangaId || input.mangaId.trim().length === 0) {
      throw new ValidationError('ID de manga requerido');
    }

    const result = await addMangaToCollection({
      collectionId: input.collectionId,
      userId: input.userId,
      mangaId: input.mangaId,
    });

    if (!result.success) {
      throw new ServiceError(result.error || 'Error al agregar manga');
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
