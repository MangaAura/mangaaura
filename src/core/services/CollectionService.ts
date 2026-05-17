import type {
  ICollectionRepository,
  CollectionUpdateInput,
  CollectionQuery,
} from './ICollectionRepository';

export class CollectionService {
  constructor(private readonly repo: ICollectionRepository) {}

  async create(params: {
    userId: string;
    title: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
  }): Promise<{
    success: boolean;
    collection?: {
      id: string;
      title: string;
      description: string | null;
      coverUrl: string | null;
      isPublic: boolean;
      itemCount: number;
      createdAt: Date;
    };
    error?: string;
  }> {
    try {
      const userCollectionCount = await this.repo.countByUser(params.userId);
      if (userCollectionCount >= 50) {
        return { success: false, error: 'Has alcanzado el límite de 50 colecciones' };
      }

      const collection = await this.repo.create({
        userId: params.userId,
        title: params.title.trim().substring(0, 100),
        description: params.description?.trim().substring(0, 500) || null,
        coverUrl: params.coverUrl || null,
        isPublic: params.isPublic ?? true,
      });

      await this.repo.logSecurityEvent(params.userId, 'CREATED_COLLECTION', collection.id, 'INFO');

      return {
        success: true,
        collection: {
          id: collection.id,
          title: collection.title,
          description: collection.description,
          coverUrl: collection.coverUrl,
          isPublic: collection.isPublic,
          itemCount: collection.itemCount,
          createdAt: collection.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      return { success: false, error: 'Error al crear colección' };
    }
  }

  async update(params: {
    collectionId: string;
    userId: string;
    title?: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
  }): Promise<{
    success: boolean;
    collection?: {
      id: string;
      title: string;
      description: string | null;
      coverUrl: string | null;
      isPublic: boolean;
      itemCount: number;
      updatedAt: Date;
    };
    error?: string;
  }> {
    try {
      const existing = await this.repo.findByUser(params.collectionId, params.userId);
      if (!existing) {
        return { success: false, error: 'Colección no encontrada' };
      }

      const updateData: CollectionUpdateInput = {};
      if (params.title) updateData.title = params.title.trim().substring(0, 100);
      if (params.description !== undefined) {
        updateData.description = params.description?.trim().substring(0, 500) || null;
      }
      if (params.coverUrl !== undefined) updateData.coverUrl = params.coverUrl || null;
      if (params.isPublic !== undefined) updateData.isPublic = params.isPublic;

      const collection = await this.repo.update(params.collectionId, updateData);

      return {
        success: true,
        collection: {
          id: collection.id,
          title: collection.title,
          description: collection.description,
          coverUrl: collection.coverUrl,
          isPublic: collection.isPublic,
          itemCount: collection.itemCount,
          updatedAt: collection.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      return { success: false, error: 'Error al actualizar colección' };
    }
  }

  async delete(params: {
    collectionId: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.repo.findById(params.collectionId);
      if (!collection || collection.userId !== params.userId) {
        return { success: false, error: 'Colección no encontrada' };
      }

      await this.repo.delete(params.collectionId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting collection:', error);
      return { success: false, error: 'Error al eliminar colección' };
    }
  }

  async addManga(params: {
    collectionId: string;
    userId: string;
    mangaId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.repo.findByUser(params.collectionId, params.userId);
      if (!collection) {
        return { success: false, error: 'Colección no encontrada' };
      }

      const manga = await this.repo.findManga(params.mangaId);
      if (!manga) {
        return { success: false, error: 'Manga no encontrado' };
      }

      const itemCount = await this.repo.countItems(params.collectionId);
      if (itemCount >= 100) {
        return { success: false, error: 'La colección ha alcanzado el límite de 100 mangas' };
      }

      await this.repo.addItem(params.collectionId, params.mangaId);

      if (!collection.coverUrl && manga.coverUrl) {
        await this.repo.updateCover(params.collectionId, manga.coverUrl);
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding manga to collection:', error);
      return { success: false, error: 'Error al agregar manga' };
    }
  }

  async removeManga(params: {
    collectionId: string;
    userId: string;
    mangaId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const collection = await this.repo.findByUser(params.collectionId, params.userId);
      if (!collection) {
        return { success: false, error: 'Colección no encontrada' };
      }

      await this.repo.removeItem(params.collectionId, params.mangaId);
      return { success: true };
    } catch (error) {
      console.error('Error removing manga from collection:', error);
      return { success: false, error: 'Error al eliminar manga' };
    }
  }

  async list(params: {
    userId?: string;
    isPublic?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    collections?: Array<{
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
    total?: number;
    error?: string;
  }> {
    try {
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const query: CollectionQuery = {
        userId: params.userId,
        isPublic: params.isPublic ?? true,
        skip: (page - 1) * limit,
        limit,
      };

      const [collections, total] = await this.repo.findMany(query);

      return {
        success: true,
        collections: collections.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          coverUrl: c.coverUrl,
          isPublic: c.isPublic,
          likesCount: c.likesCount,
          itemCount: c.itemCount,
          createdAt: c.createdAt,
          user: c.user!,
        })),
        total,
      };
    } catch (error) {
      console.error('Error getting collections:', error);
      return { success: false, error: 'Error al obtener colecciones' };
    }
  }

  async getWithItems(params: {
    collectionId: string;
    userId?: string;
  }): Promise<{
    success: boolean;
    collection?: {
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
    };
    error?: string;
  }> {
    try {
      const collection = await this.repo.findWithItems(params.collectionId);
      if (!collection) {
        return { success: false, error: 'Colección no encontrada' };
      }

      if (!collection.isPublic && collection.userId !== params.userId) {
        return { success: false, error: 'Colección privada' };
      }

      return {
        success: true,
        collection: {
          id: collection.id,
          title: collection.title,
          description: collection.description,
          coverUrl: collection.coverUrl,
          isPublic: collection.isPublic,
          likesCount: collection.likesCount,
          itemCount: collection.items.length,
          createdAt: collection.createdAt,
          isOwner: collection.userId === params.userId,
          user: collection.user!,
          items: collection.items,
        },
      };
    } catch (error) {
      console.error('Error getting collection:', error);
      return { success: false, error: 'Error al obtener colección' };
    }
  }

  async toggleLike(params: {
    collectionId: string;
    userId: string;
    isLiked?: boolean;
  }): Promise<{ success: boolean; isLiked?: boolean; error?: string }> {
    try {
      const currentLikesCount = await this.repo.getLikesCount(params.collectionId);
      if (currentLikesCount === 0 && params.collectionId) {
        const collection = await this.repo.findById(params.collectionId);
        if (!collection) {
          return { success: false, error: 'Colección no encontrada' };
        }
      }

      const wasLiked = params.isLiked ?? false;
      const newLikesCount = wasLiked
        ? Math.max(0, currentLikesCount - 1)
        : currentLikesCount + 1;

      await this.repo.updateLikesCount(params.collectionId, newLikesCount);
      return { success: true, isLiked: !wasLiked };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error: 'Error al dar like' };
    }
  }
}

export let collectionService: CollectionService | undefined;

export function initializeCollectionService(repo: ICollectionRepository): CollectionService {
  const service = new CollectionService(repo);
  collectionService = service;
  return service;
}

function getService(): CollectionService {
  if (!collectionService) {
    throw new Error('CollectionService not initialized. Call initializeCollectionService(repo) first.');
  }
  return collectionService;
}

export async function createCollection(params: {
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}): Promise<{
  success: boolean;
  collection?: {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
    itemCount: number;
    createdAt: Date;
  };
  error?: string;
}> {
  return getService().create(params);
}

export async function updateCollection(params: {
  collectionId: string;
  userId: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}): Promise<{
  success: boolean;
  collection?: {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
    itemCount: number;
    updatedAt: Date;
  };
  error?: string;
}> {
  return getService().update(params);
}

export async function deleteCollection(params: {
  collectionId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  return getService().delete(params);
}

export async function addMangaToCollection(params: {
  collectionId: string;
  userId: string;
  mangaId: string;
}): Promise<{ success: boolean; error?: string }> {
  return getService().addManga(params);
}

export async function removeMangaFromCollection(params: {
  collectionId: string;
  userId: string;
  mangaId: string;
}): Promise<{ success: boolean; error?: string }> {
  return getService().removeManga(params);
}

export async function getCollections(params: {
  userId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  collections?: Array<{
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
  total?: number;
  error?: string;
}> {
  return getService().list(params);
}

export async function getCollectionWithItems(params: {
  collectionId: string;
  userId?: string;
}): Promise<{
  success: boolean;
  collection?: {
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
  };
  error?: string;
}> {
  return getService().getWithItems(params);
}

export async function toggleLikeCollection(params: {
  collectionId: string;
  userId: string;
  isLiked?: boolean;
}): Promise<{ success: boolean; isLiked?: boolean; error?: string }> {
  return getService().toggleLike(params);
}

export default CollectionService;
