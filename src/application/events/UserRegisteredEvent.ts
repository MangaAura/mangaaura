/**
 * Evento: Usuario registrado
 * Se dispara cuando un nuevo usuario se registra en la plataforma
 * @packageDocumentation
 */

import { DomainEvent } from './DomainEvent';

/**
* Payload del evento UserRegisteredEvent
*/
export interface UserRegisteredEventPayload  {
/** ID del usuario registrado */
userId: string;
/** Email del usuario */
email: string;
/** Nombre de usuario */
username: string;
/** Proveedor de autenticación (email, google, etc) */
provider: 'email' | 'google' | 'github' | 'discord';
/** Bonus de registro en Aura */
registrationBonus: number;
/** Fecha de registro */
registeredAt: string;
}

/**
 * Evento de dominio: Usuario registrado
 */
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

/**
 * Evento: Usuario verificado
 * Se dispara cuando un usuario verifica su email
 */
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

/**
 * Evento: Perfil de usuario actualizado
 * Se dispara cuando un usuario actualiza su perfil
 */
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

