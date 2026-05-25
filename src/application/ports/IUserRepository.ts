/**
 * Interfaz del repositorio de usuarios (Port en Clean Architecture)
 * Define el contrato que debe implementar cualquier adaptador de persistencia
 * @packageDocumentation
 */

import { User } from '../../core/entities/User';

/**
 * Filtros para búsqueda de usuarios
 */
export interface UserFilters {
  /** Buscar por nombre de usuario (parcial) */
  username?: string;
  /** Buscar por rol */
  role?: string;
  /** Solo usuarios verificados */
  emailVerified?: boolean;
  /** Ordenar por campo */
  orderBy?: 'createdAt' | 'xpPoints' | 'auraBalance' | 'username';
  /** Dirección del ordenamiento */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Interfaz del puerto de repositorio de usuarios
 * Esta interfaz debe ser implementada por los adaptadores de infraestructura
 * (ej: PrismaUserRepository, MongoUserRepository)
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su ID
   * @param id - ID del usuario
   * @returns El usuario encontrado o null
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su email
   * @param email - Email del usuario
   * @returns El usuario encontrado o null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por su nombre de usuario
   * @param username - Nombre de usuario
   * @returns El usuario encontrado o null
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Crea un nuevo usuario
   * @param data - Datos del usuario a crear
   * @returns El usuario creado
   */
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
    displayName?: string;
    avatarUrl?: string;
    auraBalance?: number;
  }): Promise<User>;

  /**
   * Actualiza un usuario existente
   * @param id - ID del usuario
   * @param data - Datos a actualizar
   * @returns El usuario actualizado
   * @throws Error si el usuario no existe
   */
  update(id: string, data: {
    displayName?: string;
    avatarUrl?: string;
    xpPoints?: number;
    auraBalance?: number;
    readingStreak?: number;
    lastReadAt?: Date;
    role?: string;
    emailVerified?: Date;
  }): Promise<User>;

  /**
   * Elimina un usuario por su ID
   * @param id - ID del usuario
   * @throws Error si el usuario no existe
   */
  delete(id: string): Promise<void>;

  /**
   * Busca usuarios por IDs
   * @param ids - Array de IDs de usuarios
   * @returns Array de usuarios encontrados
   */
  findByIds(ids: string[]): Promise<User[]>;

  /**
   * Busca usuarios con filtros
   * @param filters - Filtros de búsqueda
   * @returns Array de usuarios que coinciden con los filtros
   */
  findAll(filters?: UserFilters): Promise<User[]>;

  /**
   * Verifica si existe un usuario con el email dado
   * @param email - Email a verificar
   * @returns true si existe, false en caso contrario
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Verifica si existe un usuario con el username dado
   * @param username - Username a verificar
   * @returns true si existe, false en caso contrario
   */
  existsByUsername(username: string): Promise<boolean>;

  /**
   * Actualiza el balance de Aura
   * @param userId - ID del usuario
   * @param amount - Monto a agregar (positivo) o restar (negativo)
   * @returns El nuevo balance
   */
  updateAura(userId: string, amount: number): Promise<number>;

  /**
   * Actualiza los puntos de XP
   * @param userId - ID del usuario
   * @param amount - Monto a agregar
   * @returns El nuevo total de XP
   */
  updateXP(userId: string, amount: number): Promise<number>;

  /**
   * Obtiene el leaderboard de usuarios por XP
   * @param limit - Cantidad de usuarios a retornar
   * @returns Array de usuarios ordenados por XP
   */
  getLeaderboard(limit?: number): Promise<User[]>;

  /**
   * Obtiene la cantidad total de usuarios
   * @returns Número total de usuarios
   */
  count(): Promise<number>;
}

/**
 * Error lanzado cuando un usuario no es encontrado
 */
export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(identifier: string) {
    super(`Usuario no encontrado: ${identifier}`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Error lanzado cuando el email ya está en uso
 */
export class EmailAlreadyExistsError extends Error {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly isOperational = true;
  constructor(email: string) {
    super(`El email ya está en uso: ${email}`);
    this.name = 'EmailAlreadyExistsError';
  }
}

/**
 * Error lanzado cuando el username ya está en uso
 */
export class UsernameAlreadyExistsError extends Error {
  readonly code = 'USERNAME_ALREADY_EXISTS';
  readonly isOperational = true;
  constructor(username: string) {
    super(`El nombre de usuario ya está en uso: ${username}`);
    this.name = 'UsernameAlreadyExistsError';
  }
}
