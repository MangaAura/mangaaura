/**
 * DTO para completar la lectura de un capítulo
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';

/**
 * Datos requeridos para completar un capítulo
 */
export interface CompleteChapterDTO {
  /** ID del usuario que completó el capítulo */
  userId: string;
  /** ID del capítulo completado */
  chapterId: string;
}

/**
 * Resultado de completar un capítulo
 */
export interface CompleteChapterResultDTO {
  /** XP ganado por completar el capítulo */
  xpGained: number;
  /** Nuevo nivel alcanzado (si subió) */
  newLevel?: number;
  /** Streak actualizado */
  streakUpdated: {
    previous: number;
    current: number;
    streakIncreased: boolean;
  };
  /** Si subió de nivel */
  levelUp: boolean;
  /** XP total actual del usuario */
  totalXP: number;
  /** Nivel actual del usuario */
  currentLevel: number;
  /** Progreso al siguiente nivel (0-100) */
  progressToNextLevel: number;
}

/**
 * Valida los datos para completar un capítulo
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateCompleteChapterDTO(dto: CompleteChapterDTO): void {
  if (!dto.userId || dto.userId.trim().length === 0) {
    throw new ValidationError('ID de usuario requerido');
  }

  if (!dto.chapterId || dto.chapterId.trim().length === 0) {
    throw new ValidationError('ID de capítulo requerido');
  }
}

/**
 * Crea el resultado de completar un capítulo
 * @param data - Datos del resultado
 * @returns CompleteChapterResultDTO
 */
export function createCompleteChapterResultDTO(
  data: Omit<CompleteChapterResultDTO, 'levelUp'>
): CompleteChapterResultDTO {
  return {
    ...data,
    levelUp: data.newLevel !== undefined && data.newLevel > data.currentLevel,
  };
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
