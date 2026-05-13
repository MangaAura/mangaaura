import { DomainError } from '../../../core/errors/DomainError';
import { updateCollection } from '../../../core/services/CollectionService';

export interface UpdateCollectionInputDTO {
  collectionId: string;
  userId: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionOutputDTO {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  itemCount: number;
  updatedAt: Date;
}

export class UpdateCollectionUseCase {
  async execute(input: UpdateCollectionInputDTO): Promise<UpdateCollectionOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new ValidationError('El nombre no puede estar vacío');
    }

    const result = await updateCollection({
      collectionId: input.collectionId,
      userId: input.userId,
      title: input.name,
      description: input.description,
      isPublic: input.isPublic,
    });

    if (!result.success || !result.collection) {
      throw new ServiceError(result.error || 'Error al actualizar colección');
    }

    return result.collection;
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
