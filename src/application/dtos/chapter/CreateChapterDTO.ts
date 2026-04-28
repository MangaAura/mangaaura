/**
 * DTO para crear un nuevo capítulo
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';

/**
 * Datos requeridos para crear un capítulo
 */
export interface CreateChapterDTO {
  /** ID del manga al que pertenece */
  mangaId: string;
  /** Número del capítulo */
  chapterNumber: number;
  /** Título del capítulo (opcional) */
  title?: string;
  /** Total de páginas */
  totalPages: number;
  /** URLs de las páginas */
  pageUrls: string[];
  /** Meta de crowdfunding para desbloquear (opcional) */
  crowdfundingGoal?: number;
}

/**
 * Valida los datos para crear un capítulo
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateCreateChapterDTO(dto: CreateChapterDTO): void {
  if (!dto.mangaId || dto.mangaId.trim().length === 0) {
    throw new ValidationError('ID del manga requerido');
  }

  if (typeof dto.chapterNumber !== 'number' || !Number.isFinite(dto.chapterNumber)) {
    throw new ValidationError('Número de capítulo debe ser un número válido');
  }

  if (dto.chapterNumber <= 0) {
    throw new ValidationError('Número de capítulo debe ser mayor a 0');
  }

  if (!Number.isInteger(dto.chapterNumber)) {
    throw new ValidationError('Número de capítulo debe ser un número entero');
  }

  if (dto.title !== undefined && dto.title.length > 200) {
    throw new ValidationError('Título no puede exceder 200 caracteres');
  }

  if (typeof dto.totalPages !== 'number' || !Number.isFinite(dto.totalPages)) {
    throw new ValidationError('Total de páginas debe ser un número válido');
  }

  if (dto.totalPages <= 0) {
    throw new ValidationError('Total de páginas debe ser mayor a 0');
  }

  if (!Number.isInteger(dto.totalPages)) {
    throw new ValidationError('Total de páginas debe ser un número entero');
  }

  if (!Array.isArray(dto.pageUrls)) {
    throw new ValidationError('URLs de páginas deben ser un array');
  }

  if (dto.pageUrls.length === 0) {
    throw new ValidationError('Debe proporcionar al menos una página');
  }

  if (dto.pageUrls.length !== dto.totalPages) {
    throw new ValidationError('La cantidad de URLs debe coincidir con el total de páginas');
  }

  for (let i = 0; i < dto.pageUrls.length; i++) {
    const url = dto.pageUrls[i];
    if (!url || url.trim().length === 0) {
      throw new ValidationError(`URL de página ${i + 1} está vacía`);
    }
    try {
      new URL(url);
    } catch {
      throw new ValidationError(`URL de página ${i + 1} es inválida`);
    }
  }

  if (dto.crowdfundingGoal !== undefined) {
    if (typeof dto.crowdfundingGoal !== 'number' || !Number.isFinite(dto.crowdfundingGoal)) {
      throw new ValidationError('Meta de crowdfunding debe ser un número válido');
    }
    if (dto.crowdfundingGoal < 0) {
      throw new ValidationError('Meta de crowdfunding no puede ser negativa');
    }
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
