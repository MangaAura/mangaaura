import { DomainEvent } from './DomainEvent';

export interface ChapterCompletedEventPayload {
  userId: string;
  chapterId: string;
  mangaId: string;
  chapterNumber: number;
  xpGained: number;
  readingStreak: number;
  completedAt: string;
  [key: string]: unknown;
}

export class ChapterCompletedEvent extends DomainEvent {
  readonly name = 'CHAPTER_COMPLETED';
  readonly payload: ChapterCompletedEventPayload;

  constructor(payload: { userId: string; chapterId: string; mangaId: string; chapterNumber: number; xpGained: number; readingStreak: number }) {
    super();
    this.payload = {
      userId: payload.userId,
      chapterId: payload.chapterId,
      mangaId: payload.mangaId,
      chapterNumber: payload.chapterNumber,
      xpGained: payload.xpGained,
      readingStreak: payload.readingStreak,
      completedAt: this.timestamp.toISOString(),
    };
  }
}

export class ReadingSessionCreatedEvent extends DomainEvent {
  readonly name = 'READING_SESSION_CREATED';
  readonly payload: {
    sessionId: string;
    userId: string;
    chapterId: string;
    mangaId: string;
    startTime: string;
    endTime: string;
    pagesRead: number;
    totalPages: number;
    completed: boolean;
  };

  constructor(payload: Omit<ReadingSessionCreatedEvent['payload'], 'sessionId'>) {
    super();
    this.payload = {
      ...payload,
      sessionId: crypto.randomUUID(),
    };
  }
}

export class ReadingStreakUpdatedEvent extends DomainEvent {
  readonly name = 'READING_STREAK_UPDATED';
  readonly payload: {
    userId: string;
    previousStreak: number;
    newStreak: number;
    streakIncreased: boolean;
    streakBroken: boolean;
    updatedAt: string;
  };

  constructor(payload: {
    userId: string;
    previousStreak: number;
    newStreak: number;
  }) {
    super();
    this.payload = {
      ...payload,
      streakIncreased: payload.newStreak > payload.previousStreak,
      streakBroken: payload.newStreak < payload.previousStreak,
      updatedAt: this.timestamp.toISOString(),
    };
  }
}
