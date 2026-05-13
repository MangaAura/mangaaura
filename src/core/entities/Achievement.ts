import { XP } from '../value-objects/XP';

export type AchievementDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';

export type AchievementConditionType =
  | 'CHAPTERS_READ'
  | 'COMMENTS_POSTED'
  | 'CORRECTIONS_APPROVED'
  | 'MANGAS_COMPLETED'
  | 'COMMENT_LIKES_RECEIVED'
  | 'MANGAS_CREATED'
  | 'SPONSORSHIPS_WON'
  | 'LEVEL_REACHED';

export interface AchievementCondition {
  type: AchievementConditionType;
  count?: number;
  level?: number;
}

export interface AchievementProps {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl?: string;
  condition: AchievementCondition;
  category: string;
  difficulty: AchievementDifficulty;
  createdAt?: Date;
}

export interface UserAchievementProps {
  userId: string;
  achievementId: string;
  unlockedAt?: Date;
}

export interface AchievementDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class Achievement {
  private _id: string;
  private _badgeId: string;
  private _name: string;
  private _description: string;
  private _xpReward: number;
  private _iconUrl: string | undefined;
  private _condition: AchievementCondition;
  private _category: string;
  private _difficulty: AchievementDifficulty;
  private _createdAt: Date;

  constructor(props: AchievementProps) {
    this._id = props.id;
    this._badgeId = props.badgeId;
    this._name = props.name;
    this._description = props.description;
    this._xpReward = props.xpReward;
    this._iconUrl = props.iconUrl;
    this._condition = { ...props.condition };
    this._category = props.category;
    this._difficulty = props.difficulty;
    this._createdAt = props.createdAt ?? new Date();
  }

  get id(): string { return this._id; }
  get badgeId(): string { return this._badgeId; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get xpReward(): number { return this._xpReward; }
  get iconUrl(): string | undefined { return this._iconUrl; }
  get condition(): AchievementCondition { return { ...this._condition }; }
  get category(): string { return this._category; }
  get difficulty(): AchievementDifficulty { return this._difficulty; }
  get createdAt(): Date { return this._createdAt; }

  get xpRewardValue(): XP {
    return XP.fromAchievement(this._xpReward);
  }

  checkCompleted(stats: {
    chaptersRead: number;
    commentsPosted: number;
    correctionsApproved: number;
    mangasCompleted: number;
    commentLikesReceived: number;
    mangasCreated: number;
    sponsorshipsWon: number;
    currentLevel: number;
  }): boolean {
    switch (this._condition.type) {
      case 'CHAPTERS_READ':
        return stats.chaptersRead >= (this._condition.count ?? 1);
      case 'COMMENTS_POSTED':
        return stats.commentsPosted >= (this._condition.count ?? 1);
      case 'CORRECTIONS_APPROVED':
        return stats.correctionsApproved >= (this._condition.count ?? 1);
      case 'MANGAS_COMPLETED':
        return stats.mangasCompleted >= (this._condition.count ?? 1);
      case 'COMMENT_LIKES_RECEIVED':
        return stats.commentLikesReceived >= (this._condition.count ?? 1);
      case 'MANGAS_CREATED':
        return stats.mangasCreated >= (this._condition.count ?? 1);
      case 'SPONSORSHIPS_WON':
        return stats.sponsorshipsWon >= (this._condition.count ?? 1);
      case 'LEVEL_REACHED':
        return stats.currentLevel >= (this._condition.level ?? 1);
      default:
        return false;
    }
  }

  get target(): number {
    if (this._condition.count !== undefined) return this._condition.count;
    if (this._condition.level !== undefined) return this._condition.level;
    return 1;
  }

  calculateProgress(stats: {
    chaptersRead: number;
    commentsPosted: number;
    correctionsApproved: number;
    mangasCompleted: number;
    commentLikesReceived: number;
    mangasCreated: number;
    sponsorshipsWon: number;
    currentLevel: number;
  }): number {
    switch (this._condition.type) {
      case 'CHAPTERS_READ': return stats.chaptersRead;
      case 'COMMENTS_POSTED': return stats.commentsPosted;
      case 'CORRECTIONS_APPROVED': return stats.correctionsApproved;
      case 'MANGAS_COMPLETED': return stats.mangasCompleted;
      case 'COMMENT_LIKES_RECEIVED': return stats.commentLikesReceived;
      case 'MANGAS_CREATED': return stats.mangasCreated;
      case 'SPONSORSHIPS_WON': return stats.sponsorshipsWon;
      case 'LEVEL_REACHED': return stats.currentLevel;
      default: return 0;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      badgeId: this._badgeId,
      name: this._name,
      description: this._description,
      xpReward: this._xpReward,
      iconUrl: this._iconUrl,
      condition: this._condition,
      category: this._category,
      difficulty: this._difficulty,
      createdAt: this._createdAt.toISOString(),
    };
  }
}