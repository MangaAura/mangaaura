import { DomainError } from '../errors/DomainError';
import { Slug } from '../value-objects/Slug';

export type MangaStatus = 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';

export class InvalidMangaStatusError extends DomainError {
  readonly code = 'INVALID_MANGA_STATUS';
  readonly isOperational = true;
  constructor(status: string) {
    super(`Estado de manga inv\u00e1lido: ${status}`);
  }
}

export class InvalidMangaTitleError extends DomainError {
  readonly code = 'INVALID_MANGA_TITLE';
  readonly isOperational = true;
  constructor() {
    super('El t\u00edtulo del manga es requerido');
  }
}

export interface MangaProps {
  id: string;
  title: string;
  slug: Slug;
  description?: string;
  coverUrl?: string;
  authorId: string;
  authorName?: string;
  status?: MangaStatus;
  tags?: string[];
  totalViews?: number;
  rating?: number;
  chaptersCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MangaDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class Manga {
  private _id: string;
  private _title: string;
  private _slug: Slug;
  private _description: string | undefined;
  private _coverUrl: string | undefined;
  private _authorId: string;
  private _authorName: string;
  private _status: MangaStatus;
  private _tags: string[];
  private _totalViews: number;
  private _rating: number;
  private _chaptersCount: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: MangaDomainEvent[] = [];

  constructor(props: MangaProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidMangaTitleError();
    }
    this._id = props.id;
    this._title = props.title.trim();
    this._slug = props.slug;
    this._description = props.description;
    this._coverUrl = props.coverUrl;
    this._authorId = props.authorId;
    this._authorName = props.authorName ?? 'Unknown';
    this._status = Manga.validateStatus(props.status ?? 'DRAFT');
    this._tags = (props.tags ?? []).map(t => t.toLowerCase().trim());
    this._totalViews = props.totalViews ?? 0;
    this._rating = props.rating ?? 0;
    this._chaptersCount = props.chaptersCount ?? 0;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: Omit<MangaProps, 'id' | 'slug'> & { id?: string }): { manga: Manga; events: MangaDomainEvent[] } {
    const id = props.id ?? crypto.randomUUID();
    const slug = Slug.fromTitle(props.title);

    const manga = new Manga({
      ...props,
      id,
      slug,
    });

    manga._domainEvents.push({
      type: 'MANGA_CREATED',
      payload: {
        mangaId: id,
        title: manga._title,
        slug: manga._slug.value,
        authorId: manga._authorId,
        status: manga._status,
        tags: manga._tags,
      },
      occurredAt: new Date(),
    });

    return { manga, events: [...manga._domainEvents] };
  }

  private static validateStatus(status: string): MangaStatus {
    const validStatuses: MangaStatus[] = ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'DRAFT'];
    if (!validStatuses.includes(status as MangaStatus)) {
      throw new InvalidMangaStatusError(status);
    }
    return status as MangaStatus;
  }

  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get slug(): Slug { return this._slug; }
  get description(): string | undefined { return this._description; }
  get coverUrl(): string | undefined { return this._coverUrl; }
  get authorId(): string { return this._authorId; }
  get authorName(): string { return this._authorName; }
  get status(): MangaStatus { return this._status; }
  get tags(): string[] { return [...this._tags]; }
  get totalViews(): number { return this._totalViews; }
  get rating(): number { return this._rating; }
  get chaptersCount(): number { return this._chaptersCount; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  isPublished(): boolean {
    return this._status === 'ONGOING' || this._status === 'COMPLETED';
  }

  incrementViews(): void {
    this._totalViews++;
    this._updatedAt = new Date();
  }

  incrementChapters(): void {
    this._chaptersCount++;
    this._updatedAt = new Date();
  }

  updateDetails(updates: {
    title?: string;
    description?: string;
    coverUrl?: string;
    tags?: string[];
  }): void {
    if (updates.title !== undefined && updates.title.trim().length > 0) {
      this._title = updates.title.trim();
      this._slug = Slug.fromTitle(updates.title);
    }
    if (updates.description !== undefined) {
      this._description = updates.description;
    }
    if (updates.coverUrl !== undefined) {
      this._coverUrl = updates.coverUrl;
    }
    if (updates.tags !== undefined) {
      this._tags = updates.tags.map(t => t.toLowerCase().trim());
    }
    this._updatedAt = new Date();

    this._domainEvents.push({
      type: 'MANGA_UPDATED',
      payload: {
        mangaId: this._id,
        authorId: this._authorId,
        changes: updates,
      },
      occurredAt: new Date(),
    });
  }

  changeStatus(newStatus: MangaStatus): void {
    const previousStatus = this._status;
    this._status = Manga.validateStatus(newStatus);
    this._updatedAt = new Date();

    this._domainEvents.push({
      type: 'MANGA_STATUS_CHANGED',
      payload: {
        mangaId: this._id,
        previousStatus,
        newStatus,
      },
      occurredAt: new Date(),
    });
  }

  get domainEvents(): MangaDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      title: this._title,
      slug: this._slug.value,
      description: this._description,
      coverUrl: this._coverUrl,
      authorId: this._authorId,
      authorName: this._authorName,
      status: this._status,
      tags: this._tags,
      totalViews: this._totalViews,
      rating: this._rating,
      chaptersCount: this._chaptersCount,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}