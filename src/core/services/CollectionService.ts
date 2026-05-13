import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-audit';

interface CreateCollectionParams {
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}

interface UpdateCollectionParams {
  collectionId: string;
  userId: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}

interface AddMangaParams {
  collectionId: string;
  userId: string;
  mangaId: string;
}

interface GetCollectionsParams {
  userId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Create a new collection
 */
export async function createCollection({
  userId,
  title,
  description,
  coverUrl,
  isPublic = true,
}: CreateCollectionParams): Promise<{
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
    // Check collection limit per user (max 50)
    const userCollectionCount = await prisma.collection.count({
      where: { userId },
    });

    if (userCollectionCount >= 50) {
      return {
        success: false,
        error: 'Has alcanzado el límite de 50 colecciones',
      };
    }

    const collection = await prisma.collection.create({
      data: {
        userId,
        title: title.trim().substring(0, 100),
        description: description?.trim().substring(0, 500) || null,
        coverUrl: coverUrl || null,
        isPublic,
      },
      include: {
        items: {
          select: { id: true },
        },
      },
    });

    // Log activity
    await logSecurityEvent({
      userId,
      action: 'CREATED_COLLECTION',
      targetId: collection.id,
      severity: 'INFO',
    });

    return {
      success: true,
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverUrl: collection.coverUrl,
        isPublic: collection.isPublic,
        itemCount: collection.items.length,
        createdAt: collection.createdAt,
      },
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: 'Error al crear colección' };
  }
}

/**
 * Update a collection
 */
export async function updateCollection({
  collectionId,
  userId,
  title,
  description,
  coverUrl,
  isPublic,
}: UpdateCollectionParams): Promise<{
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
    // Verify ownership
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { items: { select: { id: true } } },
    });

    if (!existing) {
      return { success: false, error: 'Colección no encontrada' };
    }

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(title && { title: title.trim().substring(0, 100) }),
        ...(description !== undefined && {
          description: description?.trim().substring(0, 500) || null,
        }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        items: {
          select: { id: true },
        },
      },
    });

    return {
      success: true,
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        coverUrl: collection.coverUrl,
        isPublic: collection.isPublic,
        itemCount: collection.items.length,
        updatedAt: collection.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: 'Error al actualizar colección' };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection({
  collectionId,
  userId,
}: {
  collectionId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      return { success: false, error: 'Colección no encontrada' };
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: 'Error al eliminar colección' };
  }
}

/**
 * Add manga to collection
 */
export async function addMangaToCollection({
  collectionId,
  userId,
  mangaId,
}: AddMangaParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Verify ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      return { success: false, error: 'Colección no encontrada' };
    }

    // Check if manga exists
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true },
    });

    if (!manga) {
      return { success: false, error: 'Manga no encontrado' };
    }

    // Check collection size limit (max 100 mangas per collection)
    const itemCount = await prisma.collectionItem.count({
      where: { collectionId },
    });

    if (itemCount >= 100) {
      return {
        success: false,
        error: 'La colección ha alcanzado el límite de 100 mangas',
      };
    }

    // Add to collection (upsert to handle duplicates)
    await prisma.collectionItem.upsert({
      where: {
        collectionId_mangaId: {
          collectionId,
          mangaId,
        },
      },
      update: {}, // No update needed
      create: {
        collectionId,
        mangaId,
      },
    });

    // Update collection cover if not set
    if (!collection.coverUrl) {
      const mangaCover = await prisma.mangaSeries.findUnique({
        where: { id: mangaId },
        select: { coverUrl: true },
      });
      if (mangaCover?.coverUrl) {
        await prisma.collection.update({
          where: { id: collectionId },
          data: { coverUrl: mangaCover.coverUrl },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding manga to collection:', error);
    return { success: false, error: 'Error al agregar manga' };
  }
}

/**
 * Remove manga from collection
 */
export async function removeMangaFromCollection({
  collectionId,
  userId,
  mangaId,
}: AddMangaParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      return { success: false, error: 'Colección no encontrada' };
    }

    await prisma.collectionItem.delete({
      where: {
        collectionId_mangaId: {
          collectionId,
          mangaId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing manga from collection:', error);
    return { success: false, error: 'Error al eliminar manga' };
  }
}

/**
 * Get collections
 */
export async function getCollections({
  userId,
  isPublic = true,
  page = 1,
  limit = 20,
}: GetCollectionsParams): Promise<{
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
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) {
      where.userId = userId;
    } else {
      where.isPublic = isPublic;
    }

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { likesCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          items: {
            select: { id: true },
          },
        },
      }),
      prisma.collection.count({ where }),
    ]);

    return {
      success: true,
      collections: collections.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        coverUrl: c.coverUrl,
        isPublic: c.isPublic,
        likesCount: c.likesCount,
        itemCount: c.items.length,
        createdAt: c.createdAt,
        user: c.user,
      })),
      total,
    };
  } catch (error) {
    console.error('Error getting collections:', error);
    return { success: false, error: 'Error al obtener colecciones' };
  }
}

/**
 * Get single collection with items
 */
export async function getCollectionWithItems({
  collectionId,
  userId,
}: {
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
  const collection = await prisma.collection.findUnique({
  where: { id: collectionId },
  include: {
  user: {
  select: {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  },
  },
  items: {
    include: {
      collection: true,
    },
  },
  },
  }) as any;

  if (!collection) {
  return { success: false, error: 'Colección no encontrada' };
  }

  // Check if user can view
  if (!collection.isPublic && collection.userId !== userId) {
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
  isOwner: collection.userId === userId,
  user: collection.user,
  items: collection.items.map((item: any) => ({
          id: item.id,
          mangaId: item.manga.id,
          title: item.manga.title,
          coverUrl: item.manga.coverUrl,
          slug: item.manga.slug,
          authorName: item.manga.authorName,
        })),
      },
    };
  } catch (error) {
    console.error('Error getting collection:', error);
    return { success: false, error: 'Error al obtener colección' };
  }
}

/**
 * Like/unlike collection
 */
export async function toggleLikeCollection({
collectionId,
userId,
isLiked,
}: {
collectionId: string;
userId: string;
isLiked?: boolean;
}): Promise<{ success: boolean; isLiked?: boolean; error?: string }> {
try {
const collection = await prisma.collection.findUnique({
where: { id: collectionId },
select: { likesCount: true },
});

if (!collection) {
return { success: false, error: 'Colección no encontrada' };
}

const wasLiked = isLiked ?? false;
const newLikesCount = wasLiked
? Math.max(0, collection.likesCount - 1)
: collection.likesCount + 1;

await prisma.collection.update({
where: { id: collectionId },
data: { likesCount: newLikesCount },
});

return { success: true, isLiked: !wasLiked };
} catch (error) {
console.error('Error toggling like:', error);
return { success: false, error: 'Error al dar like' };
}
}
