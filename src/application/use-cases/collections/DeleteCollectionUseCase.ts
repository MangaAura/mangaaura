import { DomainError } from '../../../core/errors/DomainError';
import { deleteCollection } from '../../../core/services/CollectionService';

export interface DeleteCollectionInputDTO {
  collectionId: string;
  userId: string;
}

export interface DeleteCollectionOutputDTO {
  success: boolean;
}

export class DeleteCollectionUseCase {
  async execute(input: DeleteCollectionInputDTO): Promise<DeleteCollectionOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const result = await deleteCollection({
      collectionId: input.collectionId,
      userId: input.userId,
    });

    if (!result.success) {
      throw new ServiceError(result.error || 'Error al eliminar colección');
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
