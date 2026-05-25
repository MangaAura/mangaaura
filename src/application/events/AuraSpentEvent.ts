/**
 * Evento: Aura gastados
 * Se dispara cuando un usuario gasta Aura
 * @packageDocumentation
 */

import { DomainEvent } from './DomainEvent';
import type { AuraTransactionType } from '../types/transaction-types';

/**
* Payload del evento AuraSpentEvent
*/
export interface AuraSpentEventPayload {
/** ID del usuario */
userId: string;
/** Cantidad gastada */
amount: number;
/** Tipo de transacción */
type: AuraTransactionType;
/** Descripción de la transacción */
description: string;
/** Nuevo balance del usuario */
newBalance: number;
/** ID de la transacción */
transactionId: string;
/** ID del manga relacionado (opcional) */
mangaId?: string;
/** ID del capítulo relacionado (opcional) */
chapterId?: string;
/** ID del receptor (para propinas) */
recipientId?: string;
/** Fecha de la transacción */
spentAt: string;
[key: string]: unknown;
}

/**
 * Evento de dominio: Aura gastados
 */
export class AuraSpentEvent extends DomainEvent {
  readonly name = 'AURA_SPENT';
  readonly payload: AuraSpentEventPayload;

  constructor(payload: {
    userId: string;
    amount: number;
    type: AuraTransactionType;
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

/**
* Payload del evento AuraReceivedEvent
*/
export interface AuraReceivedEventPayload {
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

/**
* Evento: Aura recibidos
* Se dispara cuando un usuario recibe Aura
*/
export class AuraReceivedEvent extends DomainEvent {
readonly name = 'AURA_RECEIVED';
readonly payload: AuraReceivedEventPayload;

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

/**
* Payload del evento AuthorEarningsEvent
*/
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

/**
* Evento: Aura ganados por autor
* Se dispara cuando un autor recibe propinas o contribuciones
*/
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

/**
 * Payload del evento CrowdfundingContributionEvent
 */
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

/**
* Evento: Contribución de crowdfunding
* Se dispara cuando se realiza una contribución a un capítulo
*/
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

/**
 * Evento: Meta de crowdfunding alcanzada
 * Se dispara cuando un capítulo alcanza su meta de crowdfunding
 */
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
