/**
 * DTO para crear un nuevo manga
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';

/**
 * Estado de publicación del manga
 */
export type MangaStatus = 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED' | 'DRAFT';

/**
 * Datos requeridos para crear un manga
 */
export interface CreateMangaDTO {
  /** Título del manga (requerido) */
  title: string;
  /** Descripción del manga (opcional) */
  description?: string;
  /** URL de la portada (opcional) */
  coverUrl?: string;
  /** Tags/categorías del manga (opcional) */
  tags?: string[];
  /** Estado de publicación (opcional, default: DRAFT) */
  status?: MangaStatus;
}

/**
 * Valida los datos para crear un manga
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateCreateMangaDTO(dto: CreateMangaDTO): void {
  if (!dto.title || dto.title.trim().length === 0) {
    throw new ValidationError('Título requerido');
  }

  if (dto.title.length > 200) {
    throw new ValidationError('Título no puede exceder 200 caracteres');
  }

  if (dto.description !== undefined && dto.description.length > 5000) {
    throw new ValidationError('Descripción no puede exceder 5000 caracteres');
  }

  if (dto.coverUrl !== undefined) {
    if (dto.coverUrl.length > 500) {
      throw new ValidationError('Cover URL es demasiado larga');
    }
    // Validar que sea una URL válida
    try {
      new URL(dto.coverUrl);
    } catch {
      throw new ValidationError('Cover URL inválida');
    }
  }

  if (dto.tags !== undefined) {
    if (dto.tags.length > 20) {
      throw new ValidationError('No puede tener más de 20 tags');
    }
    for (const tag of dto.tags) {
      if (tag.length > 30) {
        throw new ValidationError('Cada tag no puede exceder 30 caracteres');
      }
      if (tag.trim().length === 0) {
        throw new ValidationError('Los tags no pueden estar vacíos');
      }
    }
    // Verificar tags duplicados (case-insensitive)
    const lowerTags = dto.tags.map(t => t.toLowerCase());
    if (new Set(lowerTags).size !== lowerTags.length) {
      throw new ValidationError('No puede haber tags duplicados');
    }
  }

  if (dto.status !== undefined) {
    const validStatuses: MangaStatus[] = ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'DRAFT'];
    if (!validStatuses.includes(dto.status)) {
      throw new ValidationError('Estado inválido');
    }
  }
}

/**
 * Genera un slug a partir del título
 * @param title - Título del manga
 * @returns Slug generado
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .substring(0, 100); // Limitar longitud
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
