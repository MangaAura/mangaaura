import { DomainError } from '../errors/DomainError';

export class InvalidChapterNumberError extends DomainError {
  readonly code = 'INVALID_CHAPTER_NUMBER';
  readonly isOperational = true;
  constructor(number: number) {
    super(`N\u00famero de cap\u00edtulo inv\u00e1lido: ${number}`);
  }
}

export class EmptyPageUrlsError extends DomainError {
  readonly code = 'EMPTY_PAGE_URLS';
  readonly isOperational = true;
  constructor() {
    super('El cap\u00edtulo debe tener al menos una p\u00e1gina');
  }
}

export interface ChapterProps {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  totalPages: number;
  pageUrls: string[];
  viewCount?: number;
  isCrowdfunded?: boolean;
  crowdfundingGoal?: number;
  crowdfundingCurrent?: number;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChapterDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class Chapter {
  private _id: string;
  private _mangaId: string;
  private _chapterNumber: number;
  private _title: string | undefined;
  private _totalPages: number;
  private _pageUrls: string[];
  private _viewCount: number;
  private _isCrowdfunded: boolean;
  private _crowdfundingGoal: number | undefined;
  private _crowdfundingCurrent: number;
  private _publishedAt: Date | undefined;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: ChapterDomainEvent[] = [];

  constructor(props: ChapterProps) {
    Chapter.validate(props);
    this._id = props.id;
    this._mangaId = props.mangaId;
    this._chapterNumber = props.chapterNumber;
    this._title = props.title;
    this._totalPages = props.totalPages;
    this._pageUrls = [...props.pageUrls];
    this._viewCount = props.viewCount ?? 0;
    this._isCrowdfunded = props.isCrowdfunded ?? false;
    this._crowdfundingGoal = props.crowdfundingGoal;
    this._crowdfundingCurrent = props.crowdfundingCurrent ?? 0;
    this._publishedAt = props.publishedAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: Omit<ChapterProps, 'id'> & { id?: string }): { chapter: Chapter; events: ChapterDomainEvent[] } {
    const id = props.id ?? crypto.randomUUID();

    const chapter = new Chapter({
      ...props,
      id,
    });

    chapter._domainEvents.push({
      type: 'CHAPTER_CREATED',
      payload: {
        chapterId: id,
        mangaId: props.mangaId,
        chapterNumber: props.chapterNumber,
        title: props.title,
        totalPages: props.totalPages,
      },
      occurredAt: new Date(),
    });

    return { chapter, events: [...chapter._domainEvents] };
  }

  private static validate(props: ChapterProps): void {
    if (typeof props.chapterNumber !== 'number' || props.chapterNumber < 1 || !Number.isInteger(props.chapterNumber)) {
      throw new InvalidChapterNumberError(props.chapterNumber);
    }
    if (!props.pageUrls || props.pageUrls.length === 0) {
      throw new EmptyPageUrlsError();
    }
  }

  get id(): string { return this._id; }
  get mangaId(): string { return this._mangaId; }
  get chapterNumber(): number { return this._chapterNumber; }
  get title(): string | undefined { return this._title; }
  get totalPages(): number { return this._totalPages; }
  get pageUrls(): string[] { return [...this._pageUrls]; }
  get viewCount(): number { return this._viewCount; }
  get isCrowdfunded(): boolean { return this._isCrowdfunded; }
  get crowdfundingGoal(): number | undefined { return this._crowdfundingGoal; }
  get crowdfundingCurrent(): number { return this._crowdfundingCurrent; }
  get publishedAt(): Date | undefined { return this._publishedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  incrementViews(): void {
    this._viewCount++;
  }

  updatePages(pageUrls: string[]): void {
    if (!pageUrls || pageUrls.length === 0) {
      throw new EmptyPageUrlsError();
    }
    this._pageUrls = [...pageUrls];
    this._totalPages = pageUrls.length;
    this._updatedAt = new Date();
  }

  addCrowdfundingContribution(amount: number): void {
    this._crowdfundingCurrent += amount;

    if (this._crowdfundingGoal && this._crowdfundingCurrent >= this._crowdfundingGoal) {
      this._isCrowdfunded = true;
    }

    this._domainEvents.push({
      type: 'CROWDFUNDING_CONTRIBUTION_ADDED',
      payload: {
        chapterId: this._id,
        amount,
        current: this._crowdfundingCurrent,
        goal: this._crowdfundingGoal,
        isCrowdfunded: this._isCrowdfunded,
      },
      occurredAt: new Date(),
    });
  }

  publish(): void {
    this._publishedAt = new Date();
    this._updatedAt = new Date();

    this._domainEvents.push({
      type: 'CHAPTER_PUBLISHED',
      payload: {
        chapterId: this._id,
        mangaId: this._mangaId,
        chapterNumber: this._chapterNumber,
        title: this._title,
        isCrowdfunded: this._isCrowdfunded,
        totalPages: this._totalPages,
      },
      occurredAt: new Date(),
    });
  }

  get domainEvents(): ChapterDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      mangaId: this._mangaId,
      chapterNumber: this._chapterNumber,
      title: this._title,
      totalPages: this._totalPages,
      pageUrls: this._pageUrls,
      viewCount: this._viewCount,
      isCrowdfunded: this._isCrowdfunded,
      crowdfundingGoal: this._crowdfundingGoal,
      crowdfundingCurrent: this._crowdfundingCurrent,
      publishedAt: this._publishedAt?.toISOString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}