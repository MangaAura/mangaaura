/**
 * Evento: Capítulo completado
 * Se dispara cuando un usuario termina de leer un capítulo
 * @packageDocumentation
 */

import { DomainEvent } from './DomainEvent';

/**
 * Payload del evento ChapterCompletedEvent
 */
export interface ChapterCompletedEventPayload {
  /** ID del usuario que completó el capítulo */
  userId: string;
  /** ID del capítulo completado */
  chapterId: string;
  /** ID del manga */
  mangaId: string;
  /** Número del capítulo */
  chapterNumber: number;
  /** XP ganado por completar el capítulo */
  xpGained: number;
  /** Streak actualizado */
  readingStreak: number;
  /** Fecha de completado */
  completedAt: string;
  [key: string]: unknown;
}

/**
 * Evento de dominio: Capítulo completado
 */
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

/**
 * Evento: Sesión de lectura creada
 * Se dispara cuando se registra una sesión de lectura
 */
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

/**
 * Evento: Streak de lectura actualizado
 * Se dispara cuando cambia el streak de lectura del usuario
 */
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
