import { XP } from '../value-objects/XP';

export interface ReadingSessionProps {
  id: string;
  userId: string;
  chapterId: string;
  mangaId: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  pagesRead?: number;
  totalPages?: number;
  completed?: boolean;
}

export interface ReadingSessionDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class ReadingSession {
  private _id: string;
  private _userId: string;
  private _chapterId: string;
  private _mangaId: string;
  private _startedAt: Date;
  private _endedAt: Date | undefined;
  private _durationSeconds: number;
  private _pagesRead: number;
  private _totalPages: number;
  private _completed: boolean;
  private _domainEvents: ReadingSessionDomainEvent[] = [];

  constructor(props: ReadingSessionProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._chapterId = props.chapterId;
    this._mangaId = props.mangaId;
    this._startedAt = props.startedAt ?? new Date();
    this._endedAt = props.endedAt;
    this._durationSeconds = props.durationSeconds ?? 0;
    this._pagesRead = props.pagesRead ?? 0;
    this._totalPages = props.totalPages ?? 0;
    this._completed = props.completed ?? false;

    if (this._completed && this._endedAt) {
      this._domainEvents.push({
        type: 'READING_SESSION_CREATED',
        payload: {
          sessionId: this._id,
          userId: this._userId,
          chapterId: this._chapterId,
          mangaId: this._mangaId,
          pagesRead: this._pagesRead,
          totalPages: this._totalPages,
          completed: true,
        },
        occurredAt: new Date(),
      });
    }
  }

  static start(props: Omit<ReadingSessionProps, 'id'> & { id?: string }): ReadingSession {
    return new ReadingSession({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      startedAt: new Date(),
    });
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get chapterId(): string { return this._chapterId; }
  get mangaId(): string { return this._mangaId; }
  get startedAt(): Date { return this._startedAt; }
  get endedAt(): Date | undefined { return this._endedAt; }
  get durationSeconds(): number { return this._durationSeconds; }
  get pagesRead(): number { return this._pagesRead; }
  get totalPages(): number { return this._totalPages; }
  get completed(): boolean { return this._completed; }

  complete(durationSeconds: number, pagesRead: number): XP {
    this._endedAt = new Date();
    this._durationSeconds = durationSeconds;
    this._pagesRead = pagesRead;
    this._completed = true;

    const xpEarned = XP.fromChapterComplete();

    this._domainEvents.push({
      type: 'CHAPTER_COMPLETED',
      payload: {
        sessionId: this._id,
        userId: this._userId,
        chapterId: this._chapterId,
        mangaId: this._mangaId,
        xpEarned: xpEarned.amount,
        durationSeconds,
        pagesRead,
      },
      occurredAt: new Date(),
    });

    return xpEarned;
  }

  isAlreadyCompleted(): boolean {
    return this._completed;
  }

  get domainEvents(): ReadingSessionDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      chapterId: this._chapterId,
      mangaId: this._mangaId,
      startedAt: this._startedAt.toISOString(),
      endedAt: this._endedAt?.toISOString(),
      durationSeconds: this._durationSeconds,
      pagesRead: this._pagesRead,
      totalPages: this._totalPages,
      completed: this._completed,
    };
  }
}