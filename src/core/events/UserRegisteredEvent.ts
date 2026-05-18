import { DomainEvent } from './DomainEvent';

export interface UserRegisteredEventPayload  {
  userId: string;
  email: string;
  username: string;
  provider: 'email' | 'google' | 'github' | 'discord';
  registrationBonus: number;
  registeredAt: string;
}

export class UserRegisteredEvent extends DomainEvent {
  readonly name = 'USER_REGISTERED';
  readonly payload: UserRegisteredEventPayload;

  constructor(payload: Omit<UserRegisteredEventPayload, 'registeredAt'>) {
    super();
    this.payload = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      provider: payload.provider,
      registrationBonus: payload.registrationBonus,
      registeredAt: this.timestamp.toISOString(),
    };
  }
}

export interface UserVerifiedEventPayload  {
  userId: string;
  email: string;
  verifiedAt: string;
}

export class UserVerifiedEvent extends DomainEvent {
  readonly name = 'USER_VERIFIED';
  readonly payload: UserVerifiedEventPayload;

  constructor(payload: { userId: string; email: string }) {
    super();
    this.payload = {
      userId: payload.userId,
      email: payload.email,
      verifiedAt: this.timestamp.toISOString(),
    };
  }
}

export interface UserProfileChanges {
  displayName?: string;
  avatarUrl?: string;
}

export interface UserProfileUpdatedEventPayload  {
  userId: string;
  changes: {
    displayName?: string;
    avatarUrl?: string;
  };
  updatedAt: string;
}

export class UserProfileUpdatedEvent extends DomainEvent {
  readonly name = 'USER_PROFILE_UPDATED';
  readonly payload: UserProfileUpdatedEventPayload;

  constructor(payload: { userId: string; changes: UserProfileChanges }) {
    super();
    this.payload = {
      userId: payload.userId,
      changes: payload.changes,
      updatedAt: this.timestamp.toISOString(),
    };
  }
}
