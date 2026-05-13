import { DomainError } from '../../../core/errors/DomainError';
import { createCollection } from '../../../core/services/CollectionService';

export interface CreateCollectionInputDTO {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreateCollectionOutputDTO {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: Date;
}

export class CreateCollectionUseCase {
  async execute(input: CreateCollectionInputDTO): Promise<CreateCollectionOutputDTO> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Nombre de colección requerido');
    }
    if (input.name.length > 100) {
      throw new ValidationError('El nombre no puede exceder 100 caracteres');
    }

    const result = await createCollection({
      userId: input.userId,
      title: input.name,
      description: input.description,
      isPublic: input.isPublic ?? true,
    });

    if (!result.success || !result.collection) {
      throw new ServiceError(result.error || 'Error al crear colección');
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
