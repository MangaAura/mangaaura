import { DomainError } from '../../../core/errors/DomainError';
import { getCollections } from '../../../core/services/CollectionService';

export interface GetCollectionsInputDTO {
  userId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface GetCollectionsOutputDTO {
  collections: Array<{
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
    likesCount: number;
    itemCount: number;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }>;
  total: number;
}

export class GetCollectionsUseCase {
  async execute(input: GetCollectionsInputDTO): Promise<GetCollectionsOutputDTO> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(Math.max(1, input.limit ?? 20), 100);

    const result = await getCollections({
      userId: input.userId,
      isPublic: input.isPublic,
      page,
      limit,
    });

    if (!result.success || !result.collections) {
      throw new ServiceError(result.error || 'Error al obtener colecciones');
    }

    return {
      collections: result.collections,
      total: result.total ?? 0,
    };
  }
}

class ServiceError extends DomainError {
  readonly code = 'SERVICE_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
