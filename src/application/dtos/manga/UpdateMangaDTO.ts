/**
 * DTO para actualizar un manga existente
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { MangaStatus } from './CreateMangaDTO';

/**
 * Datos que pueden ser actualizados de un manga
 */
export interface UpdateMangaDTO {
  /** Nuevo título (opcional) */
  title?: string;
  /** Nueva descripción (opcional) */
  description?: string;
  /** Nueva URL de portada (opcional) */
  coverUrl?: string;
  /** Nuevos tags (opcional) */
  tags?: string[];
  /** Nuevo estado (opcional) */
  status?: MangaStatus;
}

/**
 * Valida los datos de actualización de manga
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateUpdateMangaDTO(dto: UpdateMangaDTO): void {
  // Debe tener al menos un campo para actualizar
  const hasUpdate = Object.values(dto).some(v => v !== undefined);
  if (!hasUpdate) {
    throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
  }

  if (dto.title !== undefined) {
    if (dto.title.trim().length === 0) {
      throw new ValidationError('Título no puede estar vacío');
    }
    if (dto.title.length > 200) {
      throw new ValidationError('Título no puede exceder 200 caracteres');
    }
  }

  if (dto.description !== undefined) {
    if (dto.description.length > 5000) {
      throw new ValidationError('Descripción no puede exceder 5000 caracteres');
    }
  }

  if (dto.coverUrl !== undefined) {
    if (dto.coverUrl.length > 500) {
      throw new ValidationError('Cover URL es demasiado larga');
    }
    // Validar que sea una URL válida (permitir string vacío para eliminar)
    if (dto.coverUrl.length > 0) {
      try {
        new URL(dto.coverUrl);
      } catch {
        throw new ValidationError('Cover URL inválida');
      }
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
    // Verificar tags duplicados
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

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
