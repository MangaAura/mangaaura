import type {
  ICollectionRepository,
  CollectionRecord,
  CollectionCreateInput,
  CollectionUpdateInput,
  CollectionWithItems,
  CollectionQuery,
} from '@/core/services/ICollectionRepository';
import { PrismaClient } from '@/generated/prisma/client';
import { logSecurityEvent, SecurityAction, Severity } from '@/lib/security-audit';

interface PrismaCollectionItem {
  id: string;
  manga: {
    id: string;
    title: string;
    coverUrl: string | null;
    slug: string;
    authorName: string;
  };
}

export class PrismaCollectionRepository implements ICollectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countByUser(userId: string): Promise<number> {
    return this.prisma.collection.count({ where: { userId } });
  }

  async create(data: CollectionCreateInput): Promise<CollectionRecord> {
    const collection = await this.prisma.collection.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        isPublic: data.isPublic,
      },
      include: { items: { select: { id: true } } },
    });
    return this.toRecord(collection);
  }

  async findByUser(collectionId: string, userId: string): Promise<CollectionRecord | null> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { items: { select: { id: true } } },
    });
    return collection ? this.toRecord(collection) : null;
  }

  async findById(collectionId: string): Promise<CollectionRecord | null> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId },
      include: { items: { select: { id: true } } },
    });
    return collection ? this.toRecord(collection) : null;
  }

  async update(collectionId: string, data: CollectionUpdateInput): Promise<CollectionRecord> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const collection = await this.prisma.collection.update({
      where: { id: collectionId },
      data: updateData,
      include: { items: { select: { id: true } } },
    });
    return this.toRecord(collection);
  }

  async delete(collectionId: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id: collectionId } });
  }

  async findManga(mangaId: string): Promise<{ id: string; coverUrl: string | null } | null> {
    return this.prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, coverUrl: true },
    });
  }

  async countItems(collectionId: string): Promise<number> {
    return this.prisma.collectionItem.count({ where: { collectionId } });
  }

  async addItem(collectionId: string, mangaId: string): Promise<void> {
    await this.prisma.collectionItem.upsert({
      where: { collectionId_mangaId: { collectionId, mangaId } },
      update: {},
      create: { collectionId, mangaId },
    });
  }

  async removeItem(collectionId: string, mangaId: string): Promise<void> {
    await this.prisma.collectionItem.delete({
      where: { collectionId_mangaId: { collectionId, mangaId } },
    });
  }

  async findMany(query: CollectionQuery): Promise<[CollectionRecord[], number]> {
    const where: Record<string, unknown> = {};
    if (query.userId) {
      where.userId = query.userId;
    } else {
      where.isPublic = query.isPublic ?? true;
    }

    const [collections, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { likesCount: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          items: { select: { id: true } },
        },
      }),
      this.prisma.collection.count({ where }),
    ]);

    return [
      collections.map((c: any) => this.toRecord(c)),
      total,
    ];
  }

  async findWithItems(collectionId: string): Promise<CollectionWithItems | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        items: {
          include: { manga: true },
        },
      },
    }) as any;

    if (!collection) return null;

    return {
      ...this.toRecord(collection),
      items: collection.items.map((item: PrismaCollectionItem) => ({
        id: item.id,
        mangaId: item.manga.id,
        title: item.manga.title,
        coverUrl: item.manga.coverUrl,
        slug: item.manga.slug,
        authorName: item.manga.authorName,
      })),
    };
  }

  async updateCover(collectionId: string, coverUrl: string): Promise<void> {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { coverUrl },
    });
  }

  async getLikesCount(collectionId: string): Promise<number> {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { likesCount: true },
    });
    return collection?.likesCount ?? 0;
  }

  async updateLikesCount(collectionId: string, count: number): Promise<void> {
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { likesCount: count },
    });
  }

  async findCollaborators(collectionId: string): Promise<Array<{ id: string; userId: string; role: string; addedAt: Date; user: { id: string; username: string; displayName: string | null; avatarUrl: string | null } }>> {
    return this.prisma.collectionCollaborator.findMany({
      where: { collectionId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { addedAt: 'asc' },
    });
  }

  async addCollaborator(collectionId: string, userId: string, role: string, addedById: string): Promise<void> {
    await this.prisma.collectionCollaborator.create({
      data: { collectionId, userId, role, addedById },
    });
  }

  async removeCollaborator(collectionId: string, userId: string): Promise<void> {
    await this.prisma.collectionCollaborator.delete({
      where: { collectionId_userId: { collectionId, userId } },
    });
  }

  async isCollaborator(collectionId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.collectionCollaborator.count({
      where: { collectionId, userId },
    });
    return count > 0;
  }

  async findByCollaborator(collectionId: string, userId: string): Promise<{ id: string; role: string } | null> {
    const collaborator = await this.prisma.collectionCollaborator.findUnique({
      where: { collectionId_userId: { collectionId, userId } },
      select: { id: true, role: true },
    });
    return collaborator;
  }

  async logSecurityEvent(userId: string, action: string, targetId: string, severity: string): Promise<void> {
    await logSecurityEvent({ userId, action: action as SecurityAction, targetId, severity: severity as Severity });
  }

  private toRecord(data: any): CollectionRecord {
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      coverUrl: data.coverUrl,
      isPublic: data.isPublic,
      likesCount: data.likesCount ?? 0,
      itemCount: data.items?.length ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      user: data.user,
    };
  }
}
