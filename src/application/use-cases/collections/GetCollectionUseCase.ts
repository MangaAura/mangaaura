import { DomainError } from '../../../core/errors/DomainError';
import { getCollectionWithItems } from '../../../core/services/CollectionService';

export interface GetCollectionInputDTO {
  collectionId: string;
  userId?: string;
}

export interface GetCollectionOutputDTO {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  likesCount: number;
  itemCount: number;
  createdAt: Date;
  isOwner: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  items: Array<{
    id: string;
    mangaId: string;
    title: string;
    coverUrl: string | null;
    slug: string;
    authorName: string;
  }>;
}

export class GetCollectionUseCase {
  async execute(input: GetCollectionInputDTO): Promise<GetCollectionOutputDTO> {
    if (!input.collectionId || input.collectionId.trim().length === 0) {
      throw new ValidationError('ID de colección requerido');
    }

    const result = await getCollectionWithItems({
      collectionId: input.collectionId,
      userId: input.userId,
    });

    if (!result.success || !result.collection) {
      throw new ServiceError(result.error || 'Error al obtener colección');
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
