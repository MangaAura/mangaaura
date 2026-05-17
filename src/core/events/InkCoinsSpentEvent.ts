import { DomainEvent } from './DomainEvent';

type InkCoinsTransactionType =
  | 'TIP_AUTHOR'
  | 'CROWDFUND_CONTRIBUTION'
  | 'PREMIUM_CHAPTER'
  | 'MARKETPLACE_PURCHASE'
  | 'BOOST_MANGA'
  | 'OTHER';

export interface InkCoinsSpentEventPayload {
  userId: string;
  amount: number;
  type: InkCoinsTransactionType;
  description: string;
  newBalance: number;
  transactionId: string;
  mangaId?: string;
  chapterId?: string;
  recipientId?: string;
  spentAt: string;
  [key: string]: unknown;
}

export class InkCoinsSpentEvent extends DomainEvent {
  readonly name = 'INKCOINS_SPENT';
  readonly payload: InkCoinsSpentEventPayload;

  constructor(payload: {
    userId: string;
    amount: number;
    type: InkCoinsTransactionType;
    description: string;
    newBalance: number;
    transactionId: string;
    mangaId?: string;
    chapterId?: string;
    recipientId?: string;
  }) {
    super();
    this.payload = {
      userId: payload.userId,
      amount: payload.amount,
      type: payload.type,
      description: payload.description,
      newBalance: payload.newBalance,
      transactionId: payload.transactionId,
      mangaId: payload.mangaId,
      chapterId: payload.chapterId,
      recipientId: payload.recipientId,
      spentAt: this.timestamp.toISOString(),
    };
  }
}

export interface InkCoinsReceivedEventPayload {
  userId: string;
  amount: number;
  source: 'TIP' | 'CROWDFUND' | 'DAILY_BONUS' | 'ACHIEVEMENT' | 'REFERRAL' | 'OTHER';
  description: string;
  newBalance: number;
  transactionId: string;
  senderId?: string;
  receivedAt: string;
  [key: string]: unknown;
}

export class InkCoinsReceivedEvent extends DomainEvent {
  readonly name = 'INKCOINS_RECEIVED';
  readonly payload: InkCoinsReceivedEventPayload;

  constructor(payload: {
    userId: string;
    amount: number;
    source: 'TIP' | 'CROWDFUND' | 'DAILY_BONUS' | 'ACHIEVEMENT' | 'REFERRAL' | 'OTHER';
    description: string;
    newBalance: number;
    senderId?: string;
  }) {
    super();
    this.payload = {
      userId: payload.userId,
      amount: payload.amount,
      source: payload.source,
      description: payload.description,
      newBalance: payload.newBalance,
      transactionId: crypto.randomUUID(),
      senderId: payload.senderId,
      receivedAt: this.timestamp.toISOString(),
    };
  }
}

export interface AuthorEarningsEventPayload {
  authorId: string;
  amount: number;
  source: 'TIP' | 'CROWDFUND' | 'PREMIUM_CHAPTER';
  mangaId?: string;
  chapterId?: string;
  fromUserId?: string;
  totalEarnings: number;
  earnedAt: string;
  [key: string]: unknown;
}

export class AuthorEarningsEvent extends DomainEvent {
  readonly name = 'AUTHOR_EARNINGS';
  readonly payload: AuthorEarningsEventPayload;

  constructor(payload: {
    authorId: string;
    amount: number;
    source: 'TIP' | 'CROWDFUND' | 'PREMIUM_CHAPTER';
    mangaId?: string;
    chapterId?: string;
    fromUserId?: string;
    totalEarnings: number;
  }) {
    super();
    this.payload = {
      authorId: payload.authorId,
      amount: payload.amount,
      source: payload.source,
      mangaId: payload.mangaId,
      chapterId: payload.chapterId,
      fromUserId: payload.fromUserId,
      totalEarnings: payload.totalEarnings,
      earnedAt: this.timestamp.toISOString(),
    };
  }
}

export interface CrowdfundingContributionEventPayload extends Record<string, unknown> {
  chapterId: string;
  mangaId: string;
  contributorId: string;
  amount: number;
  currentAmount: number;
  goalAmount: number;
  percentageComplete: number;
  goalReached: boolean;
  contributedAt: string;
}

export class CrowdfundingContributionEvent extends DomainEvent {
  readonly name = 'CROWDFUNDING_CONTRIBUTION';
  readonly payload: CrowdfundingContributionEventPayload;

  constructor(payload: {
    chapterId: string;
    mangaId: string;
    contributorId: string;
    amount: number;
    currentAmount: number;
    goalAmount: number;
  }) {
    super();
    const percentageComplete = Math.min(100, (payload.currentAmount / payload.goalAmount) * 100);
    this.payload = {
      chapterId: payload.chapterId,
      mangaId: payload.mangaId,
      contributorId: payload.contributorId,
      amount: payload.amount,
      currentAmount: payload.currentAmount,
      goalAmount: payload.goalAmount,
      percentageComplete: Math.round(percentageComplete * 100) / 100,
      goalReached: payload.currentAmount >= payload.goalAmount,
      contributedAt: this.timestamp.toISOString(),
    };
  }
}

export interface CrowdfundingGoalReachedEventPayload extends Record<string, unknown> {
  chapterId: string;
  mangaId: string;
  authorId: string;
  totalAmount: number;
  goalAmount: number;
  contributorsCount: number;
  reachedAt: string;
}

export class CrowdfundingGoalReachedEvent extends DomainEvent {
  readonly name = 'CROWDFUNDING_GOAL_REACHED';
  readonly payload: CrowdfundingGoalReachedEventPayload;

  constructor(payload: {
    chapterId: string;
    mangaId: string;
    authorId: string;
    totalAmount: number;
    goalAmount: number;
    contributorsCount: number;
  }) {
    super();
    this.payload = {
      chapterId: payload.chapterId,
      mangaId: payload.mangaId,
      authorId: payload.authorId,
      totalAmount: payload.totalAmount,
      goalAmount: payload.goalAmount,
      contributorsCount: payload.contributorsCount,
      reachedAt: this.timestamp.toISOString(),
    };
  }
}
