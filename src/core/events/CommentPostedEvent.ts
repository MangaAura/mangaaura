import { DomainEvent } from './DomainEvent';

export interface CommentPostedEventPayload {
  userId: string;
  chapterId: string;
  commentId: string;
  content: string;
  containsSpoiler: boolean;
  spoilerConfidence: number;
  xpGained: number;
  parentId?: string;
  postedAt: string;
  [key: string]: unknown;
}

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
