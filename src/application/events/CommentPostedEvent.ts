/**
 * Evento: Comentario publicado
 * Se dispara cuando un usuario publica un comentario
 * @packageDocumentation
 */

import { DomainEvent } from './DomainEvent';

/**
 * Payload del evento CommentPostedEvent
 */
export interface CommentPostedEventPayload {
  /** ID del usuario que publicó */
  userId: string;
  /** ID del capítulo */
  chapterId: string;
  /** ID del comentario creado */
  commentId: string;
  /** Contenido del comentario */
  content: string;
  /** Si contiene spoilers */
  containsSpoiler: boolean;
  /** Confianza del análisis de spoiler (0-1) */
  spoilerConfidence: number;
  /** XP ganado por comentar */
  xpGained: number;
  /** ID del comentario padre (si es respuesta) */
  parentId?: string;
  /** Fecha de publicación */
  postedAt: string;
  [key: string]: unknown;
}

/**
 * Evento de dominio: Comentario publicado
 */
export class CommentPostedEvent extends DomainEvent {
  readonly name = 'COMMENT_POSTED';
  readonly payload: CommentPostedEventPayload;

  constructor(payload: { userId: string; chapterId: string; commentId: string; containsSpoiler: boolean; xpGained: number; parentId?: string }) {
    super();
    this.payload = {
      userId: payload.userId,
      chapterId: payload.chapterId,
      commentId: payload.commentId,
      content: '',
      containsSpoiler: payload.containsSpoiler,
      spoilerConfidence: 0,
      xpGained: payload.xpGained,
      parentId: payload.parentId,
      postedAt: this.timestamp.toISOString(),
    };
  }
}

/**
 * Evento: Comentario marcado como spoiler
 * Se dispara cuando un comentario es marcado como spoiler
 */
export class CommentMarkedAsSpoilerEvent extends DomainEvent {
  readonly name = 'COMMENT_MARKED_AS_SPOILER';
  readonly payload: {
    commentId: string;
    userId: string;
    chapterId: string;
    markedBy: string;
    reason: string;
    markedAt: string;
  };

  constructor(payload: { commentId: string; userId: string; chapterId: string; markedBy: string; reason: string }) {
    super();
    this.payload = {
      ...payload,
      markedAt: this.timestamp.toISOString(),
    };
  }
}

/**
 * Evento: Comentario reportado
 * Se dispara cuando un comentario es reportado
 */
export class CommentReportedEvent extends DomainEvent {
  readonly name = 'COMMENT_REPORTED';
  readonly payload: {
    commentId: string;
    reportedByUserId: string;
    reportReason: string;
    reportedAt: string;
  };

  constructor(payload: { commentId: string; reportedByUserId: string; reportReason: string }) {
    super();
    this.payload = {
      ...payload,
      reportedAt: this.timestamp.toISOString(),
    };
  }
}

/**
 * Evento: Comentario eliminado
 * Se dispara cuando un comentario es eliminado
 */
export class CommentDeletedEvent extends DomainEvent {
  readonly name = 'COMMENT_DELETED';
  readonly payload: {
    commentId: string;
    userId: string;
    chapterId: string;
    deletedBy: 'user' | 'moderator' | 'system';
    reason?: string;
    deletedAt: string;
  };

  constructor(payload: {
    commentId: string;
    userId: string;
    chapterId: string;
    deletedBy: 'user' | 'moderator' | 'system';
    reason?: string;
  }) {
    super();
    this.payload = {
      ...payload,
      deletedAt: this.timestamp.toISOString(),
    };
  }
}
