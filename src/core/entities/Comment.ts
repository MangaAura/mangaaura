export interface CommentProps {
  id: string;
  chapterId: string;
  authorId: string;
  content: string;
  parentId?: string;
  isHidden?: boolean;
  hiddenReason?: string;
  moderatedBy?: 'ai' | 'human';
  spoilerScore?: number;
  toxicity?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories?: string[];
  likes?: number;
  replies?: number;
  likedBy?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class Comment {
  private _id: string;
  private _chapterId: string;
  private _authorId: string;
  private _content: string;
  private _parentId: string | undefined;
  private _isHidden: boolean;
  private _hiddenReason: string | undefined;
  private _moderatedBy: 'ai' | 'human' | undefined;
  private _spoilerScore: number;
  private _toxicity: number;
  private _sentiment: 'positive' | 'negative' | 'neutral';
  private _categories: string[];
  private _likes: number;
  private _replies: number;
  private _likedBy: string[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: CommentDomainEvent[] = [];

  constructor(props: CommentProps) {
    this._id = props.id;
    this._chapterId = props.chapterId;
    this._authorId = props.authorId;
    this._content = props.content;
    this._parentId = props.parentId;
    this._isHidden = props.isHidden ?? false;
    this._hiddenReason = props.hiddenReason;
    this._moderatedBy = props.moderatedBy;
    this._spoilerScore = props.spoilerScore ?? 0;
    this._toxicity = props.toxicity ?? 0;
    this._sentiment = props.sentiment ?? 'neutral';
    this._categories = props.categories ?? [];
    this._likes = props.likes ?? 0;
    this._replies = props.replies ?? 0;
    this._likedBy = props.likedBy ?? [];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: Omit<CommentProps, 'id'> & { id?: string }): { comment: Comment; events: CommentDomainEvent[] } {
    const id = props.id ?? crypto.randomUUID();

    const comment = new Comment({ ...props, id });

    comment._domainEvents.push({
      type: 'COMMENT_CREATED',
      payload: {
        commentId: id,
        chapterId: props.chapterId,
        authorId: props.authorId,
        isHidden: props.isHidden ?? false,
        toxicity: props.toxicity ?? 0,
      },
      occurredAt: new Date(),
    });

    return { comment, events: [...comment._domainEvents] };
  }

  get id(): string { return this._id; }
  get chapterId(): string { return this._chapterId; }
  get authorId(): string { return this._authorId; }
  get content(): string { return this._content; }
  get parentId(): string | undefined { return this._parentId; }
  get isHidden(): boolean { return this._isHidden; }
  get hiddenReason(): string | undefined { return this._hiddenReason; }
  get moderatedBy(): 'ai' | 'human' | undefined { return this._moderatedBy; }
  get spoilerScore(): number { return this._spoilerScore; }
  get toxicity(): number { return this._toxicity; }
  get sentiment(): string { return this._sentiment; }
  get categories(): string[] { return [...this._categories]; }
  get likes(): number { return this._likes; }
  get replies(): number { return this._replies; }
  get likedBy(): string[] { return [...this._likedBy]; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  isReply(): boolean {
    return !!this._parentId;
  }

  hide(reason: string, moderator: 'ai' | 'human'): void {
    this._isHidden = true;
    this._hiddenReason = reason;
    this._moderatedBy = moderator;
    this._updatedAt = new Date();
  }

  toggleLike(userId: string): boolean {
    const index = this._likedBy.indexOf(userId);
    if (index === -1) {
      this._likedBy.push(userId);
      this._likes++;
      return true;
    } else {
      this._likedBy.splice(index, 1);
      this._likes--;
      return false;
    }
  }

  incrementReplies(): void {
    this._replies++;
  }

  markAsSpoiler(score: number): void {
    this._spoilerScore = score;
    this._updatedAt = new Date();
  }

  get domainEvents(): CommentDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      chapterId: this._chapterId,
      authorId: this._authorId,
      content: this._content,
      parentId: this._parentId,
      isHidden: this._isHidden,
      hiddenReason: this._hiddenReason,
      moderatedBy: this._moderatedBy,
      spoilerScore: this._spoilerScore,
      toxicity: this._toxicity,
      sentiment: this._sentiment,
      categories: this._categories,
      likes: this._likes,
      replies: this._replies,
      likedBy: this._likedBy,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}