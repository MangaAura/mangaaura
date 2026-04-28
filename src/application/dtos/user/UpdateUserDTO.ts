/**
 * DTO para actualizar datos de un usuario
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';

/**
 * Datos que pueden ser actualizados del usuario
 */
export interface UpdateUserDTO {
  /** Nuevo nombre para mostrar (opcional) */
  displayName?: string;
  /** Nueva URL del avatar (opcional) */
  avatarUrl?: string;
}

/**
 * Valida los datos de actualización de usuario
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateUpdateUserDTO(dto: UpdateUserDTO): void {
  if (dto.displayName !== undefined) {
    if (dto.displayName.length > 50) {
      throw new ValidationError('Display name no puede exceder 50 caracteres');
    }
    if (dto.displayName.trim().length === 0) {
      throw new ValidationError('Display name no puede estar vacío');
    }
  }

  if (dto.avatarUrl !== undefined) {
    if (dto.avatarUrl.length > 500) {
      throw new ValidationError('Avatar URL es demasiado larga');
    }
    // Validar que sea una URL válida
    try {
      new URL(dto.avatarUrl);
    } catch {
      throw new ValidationError('Avatar URL inválida');
    }
  }

  // Debe tener al menos un campo para actualizar
  if (dto.displayName === undefined && dto.avatarUrl === undefined) {
    throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
