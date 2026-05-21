export interface CollectionRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  likesCount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  items?: Array<{ id: string }>;
}

export interface CollectionCreateInput {
  userId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic: boolean;
}

export interface CollectionUpdateInput {
  title?: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
}

export interface CollectionWithItems extends CollectionRecord {
  items: Array<{
    id: string;
    mangaId: string;
    title: string;
    coverUrl: string | null;
    slug: string;
    authorName: string;
  }>;
}

export interface CollectionQuery {
  userId?: string;
  isPublic?: boolean;
  skip: number;
  limit: number;
}

export interface ICollectionRepository {
  countByUser(userId: string): Promise<number>;
  create(data: CollectionCreateInput): Promise<CollectionRecord>;
  findByUser(collectionId: string, userId: string): Promise<CollectionRecord | null>;
  findById(collectionId: string): Promise<CollectionRecord | null>;
  update(collectionId: string, data: CollectionUpdateInput): Promise<CollectionRecord>;
  delete(collectionId: string): Promise<void>;
  findManga(mangaId: string): Promise<{ id: string; coverUrl: string | null } | null>;
  countItems(collectionId: string): Promise<number>;
  addItem(collectionId: string, mangaId: string): Promise<void>;
  removeItem(collectionId: string, mangaId: string): Promise<void>;
  findMany(query: CollectionQuery): Promise<[CollectionRecord[], number]>;
  findWithItems(collectionId: string): Promise<CollectionWithItems | null>;
  updateCover(collectionId: string, coverUrl: string): Promise<void>;
  getLikesCount(collectionId: string): Promise<number>;
  updateLikesCount(collectionId: string, count: number): Promise<void>;
  findCollaborators(collectionId: string): Promise<Array<{ id: string; userId: string; role: string; addedAt: Date; user: { id: string; username: string; displayName: string | null; avatarUrl: string | null } }>>;
  addCollaborator(collectionId: string, userId: string, role: string, addedById: string): Promise<void>;
  removeCollaborator(collectionId: string, userId: string): Promise<void>;
  isCollaborator(collectionId: string, userId: string): Promise<boolean>;
  findByCollaborator(collectionId: string, userId: string): Promise<{ id: string; role: string } | null>;
  logSecurityEvent(userId: string, action: string, targetId: string, severity: string): Promise<void>;
}
