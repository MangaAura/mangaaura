/**
 * DTO de respuesta con datos de usuario
 * @packageDocumentation
 */

import { UserRole } from '../../../core/entities/User';

/**
 * Datos de usuario que se devuelven en las respuestas de la API
 */
export interface UserResponseDTO {
  /** ID único del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** Nombre de usuario único */
  username: string;
  /** Nombre para mostrar */
  displayName?: string;
  /** URL del avatar */
  avatarUrl?: string;
  /** Puntos de experiencia */
  xpPoints: number;
  /** Nivel actual */
  level: number;
  /** Rango/título del usuario */
  role: UserRole;
  /** Rango calculado basado en nivel */
  rank?: string;
  /** Balance de InkCoins */
  inkcoinsBalance?: number;
  /** Streak de lectura */
  readingStreak?: number;
  /** Fecha de última lectura */
  lastReadAt?: string;
  /** Fecha de creación */
  createdAt?: string;
}

/**
 * Mapea una entidad de dominio User a UserResponseDTO
 * @param user - Entidad User del dominio
 * @returns UserResponseDTO
 */
export function mapUserToResponseDTO(user: {
  id: string;
  email: { value: string };
  username: string;
  displayName?: string;
  avatarUrl?: string;
  xp: { amount: number; level: number; rank: string };
  role: UserRole;
  inkcoins?: { amount: number };
  readingStreak?: number;
  lastReadAt?: Date;
  createdAt?: Date;
}): UserResponseDTO {
  return {
    id: user.id,
    email: user.email.value,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xpPoints: user.xp.amount,
    level: user.xp.level,
    role: user.role,
    rank: user.xp.rank,
    inkcoinsBalance: user.inkcoins?.amount ?? 0,
    readingStreak: user.readingStreak ?? 0,
    lastReadAt: user.lastReadAt?.toISOString(),
    createdAt: user.createdAt?.toISOString(),
  };
}

/**
 * Lista de campos sensibles que no deben exponerse
 */
export const SENSITIVE_USER_FIELDS: string[] = [
  'passwordHash',
  'emailVerified',
  'updatedAt',
];

/**
 * Crea un DTO de respuesta público (sin datos sensibles)
 * @param user - Entidad User del dominio
 * @returns UserResponseDTO con solo datos públicos
 */
export function mapUserToPublicResponseDTO(user: {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  xp: { amount: number; level: number; rank: string };
  role: UserRole;
}): Omit<UserResponseDTO, 'email' | 'inkcoinsBalance'> {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xpPoints: user.xp.amount,
    level: user.xp.level,
    role: user.role,
    rank: user.xp.rank,
  };
}
