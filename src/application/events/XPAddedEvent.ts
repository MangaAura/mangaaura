/**
 * Evento: XP agregado
 * Se dispara cuando se agrega XP a un usuario
 * @packageDocumentation
 */

import { DomainEvent } from './DomainEvent';

/**
 * Payload del evento XPAddedEvent
 */
export interface XPAddedEventPayload extends Record<string, unknown> {
  /** ID del usuario */
  userId: string;
  /** Cantidad de XP agregada */
  amount: number;
  /** Fuente de los XP */
  source: string;
  /** XP total del usuario después de agregar */
  totalXP: number;
  /** Nivel actual del usuario */
  level: number;
  /** Descripción adicional */
  description?: string;
  /** Fecha del evento */
  addedAt: string;
}

/**
 * Evento de dominio: XP agregado
 */
export class XPAddedEvent extends DomainEvent {
  readonly name = 'XP_ADDED';
  readonly payload: XPAddedEventPayload;

  constructor(payload: {
    userId: string;
    amount: number;
    source: string;
    totalXP: number;
    level: number;
    description?: string;
  }) {
    super();
    this.payload = {
      userId: payload.userId,
      amount: payload.amount,
      source: payload.source,
      totalXP: payload.totalXP,
      level: payload.level,
      description: payload.description,
      addedAt: this.timestamp.toISOString(),
    };
  }
}

/**
 * Evento: Subida de nivel
 * Se dispara cuando un usuario sube de nivel
 */
export interface LevelUpEventPayload {
  userId: string;
  oldLevel: number;
  newLevel: number;
  oldRank: string;
  newRank: string;
  xpAtLevelUp: number;
  xpToNextLevel: number;
  leveledUpAt: string;
  [key: string]: unknown;
}

export class LevelUpEvent extends DomainEvent {
readonly name = 'LEVEL_UP';
readonly payload: LevelUpEventPayload;

constructor(payload: {
userId: string;
oldLevel: number;
newLevel: number;
oldRank: string;
newRank: string;
xpAtLevelUp: number;
}) {
super();
this.payload = {
userId: payload.userId,
oldLevel: payload.oldLevel,
newLevel: payload.newLevel,
oldRank: payload.oldRank,
newRank: payload.newRank,
xpAtLevelUp: payload.xpAtLevelUp,
xpToNextLevel: payload.newLevel * 1000, // Cada nivel necesita 1000 XP más
leveledUpAt: this.timestamp.toISOString(),
};
}
}

/**
 * Evento: Rango obtenido
 * Se dispara cuando un usuario alcanza un nuevo rango
 */
export interface RankAchievedEventPayload  {
userId: string;
rank: string;
level: number;
achievedAt: string;
}

export class RankAchievedEvent extends DomainEvent {
readonly name = 'RANK_ACHIEVED';
readonly payload: RankAchievedEventPayload;

constructor(payload: { userId: string; rank: string; level: number }) {
super();
this.payload = {
userId: payload.userId,
rank: payload.rank,
level: payload.level,
achievedAt: this.timestamp.toISOString(),
};
}
}

/**
 * Rango obtenido
 */
export interface Rank {
  name: string;
  minLevel: number;
  maxLevel: number;
}

/**
 * Rangos disponibles en la plataforma
 */
export const RANKS: Rank[] = [
  { name: 'Novato', minLevel: 1, maxLevel: 1 },
  { name: 'Lector Shonen', minLevel: 2, maxLevel: 3 },
  { name: 'Otaku Experto', minLevel: 4, maxLevel: 6 },
  { name: 'Maestro Otaku', minLevel: 7, maxLevel: 9 },
  { name: 'Leyenda Manga', minLevel: 10, maxLevel: Infinity },
];

/**
 * Obtiene el rango correspondiente a un nivel
 * @param level - Nivel del usuario
 * @returns Nombre del rango
 */
export function getRankForLevel(level: number): string {
  const rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank?.name ?? 'Novato';
}

