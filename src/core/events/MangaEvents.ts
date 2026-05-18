import { DomainEvent } from './DomainEvent';

type MangaStatus = 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';

export interface MangaCreatedEventPayload  {
  mangaId: string;
  title: string;
  slug: string;
  authorId: string;
  status: MangaStatus;
  tags: string[];
  createdAt: string;
}

export class MangaCreatedEvent extends DomainEvent {
  readonly name = 'MANGA_CREATED';
  readonly payload: MangaCreatedEventPayload;

  constructor(payload: {
    mangaId: string;
    title: string;
    slug: string;
    authorId: string;
    status: MangaStatus;
    tags: string[];
  }) {
    super();
    this.payload = {
      mangaId: payload.mangaId,
      title: payload.title,
      slug: payload.slug,
      authorId: payload.authorId,
      status: payload.status,
      tags: payload.tags,
      createdAt: this.timestamp.toISOString(),
    };
  }
}

export interface MangaChanges {
  title?: string;
  description?: string;
  coverUrl?: string;
  status?: MangaStatus;
  tags?: string[];
}

export interface MangaUpdatedEventPayload  {
  mangaId: string;
  authorId: string;
  changes: MangaChanges;
  updatedAt: string;
}

export class MangaUpdatedEvent extends DomainEvent {
  readonly name = 'MANGA_UPDATED';
  readonly payload: MangaUpdatedEventPayload;

  constructor(payload: {
    mangaId: string;
    authorId: string;
    changes: MangaChanges;
  }) {
    super();
    this.payload = {
      mangaId: payload.mangaId,
      authorId: payload.authorId,
      changes: payload.changes,
      updatedAt: this.timestamp.toISOString(),
    };
  }
}

export interface ChapterPublishedEventPayload  {
  chapterId: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  authorId: string;
  isCrowdfunded: boolean;
  totalPages: number;
  publishedAt: string;
}

export class ChapterPublishedEvent extends DomainEvent {
  readonly name = 'CHAPTER_PUBLISHED';
  readonly payload: ChapterPublishedEventPayload;

  constructor(payload: {
    chapterId: string;
    mangaId: string;
    chapterNumber: number;
    title?: string;
    authorId: string;
    isCrowdfunded: boolean;
    totalPages: number;
  }) {
    super();
    this.payload = {
      chapterId: payload.chapterId,
      mangaId: payload.mangaId,
      chapterNumber: payload.chapterNumber,
      title: payload.title,
      authorId: payload.authorId,
      isCrowdfunded: payload.isCrowdfunded,
      totalPages: payload.totalPages,
      publishedAt: this.timestamp.toISOString(),
    };
  }
}

export interface MangaStatusChangedEventPayload  {
  mangaId: string;
  previousStatus: MangaStatus;
  newStatus: MangaStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export class MangaStatusChangedEvent extends DomainEvent {
  readonly name = 'MANGA_STATUS_CHANGED';
  readonly payload: MangaStatusChangedEventPayload;

  constructor(payload: {
    mangaId: string;
    previousStatus: MangaStatus;
    newStatus: MangaStatus;
    changedBy: string;
    reason?: string;
  }) {
    super();
    this.payload = {
      mangaId: payload.mangaId,
      previousStatus: payload.previousStatus,
      newStatus: payload.newStatus,
      changedBy: payload.changedBy,
      reason: payload.reason,
      changedAt: this.timestamp.toISOString(),
    };
  }
}

export interface MangaFavoritedEventPayload  {
  userId: string;
  mangaId: string;
  favoritedAt: string;
}

export class MangaFavoritedEvent extends DomainEvent {
  readonly name = 'MANGA_FAVORITED';
  readonly payload: MangaFavoritedEventPayload;

  constructor(payload: { userId: string; mangaId: string }) {
    super();
    this.payload = {
      userId: payload.userId,
      mangaId: payload.mangaId,
      favoritedAt: this.timestamp.toISOString(),
    };
  }
}

export interface MangaRatedEventPayload  {
  userId: string;
  mangaId: string;
  rating: number;
  previousRating?: number;
  newAverageRating: number;
  ratedAt: string;
}

export class MangaRatedEvent extends DomainEvent {
  readonly name = 'MANGA_RATED';
  readonly payload: MangaRatedEventPayload;

  constructor(payload: {
    userId: string;
    mangaId: string;
    rating: number;
    previousRating?: number;
    newAverageRating: number;
  }) {
    super();
    this.payload = {
      userId: payload.userId,
      mangaId: payload.mangaId,
      rating: payload.rating,
      previousRating: payload.previousRating,
      newAverageRating: payload.newAverageRating,
      ratedAt: this.timestamp.toISOString(),
    };
  }
}
