/**
 * DTO para registrar un nuevo usuario
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';

/**
 * Datos requeridos para registrar un usuario
 */
export interface RegisterUserDTO {
  /** Email del usuario (debe ser único) */
  email: string;
  /** Nombre de usuario único */
  username: string;
  /** Contraseña en texto plano (se hasheará) */
  password: string;
  /** Nombre para mostrar (opcional) */
  displayName?: string;
}

/**
 * Valida los datos de registro de usuario
 * @param dto - Datos a validar
 * @throws DomainError si los datos son inválidos
 */
export function validateRegisterUserDTO(dto: RegisterUserDTO): void {
  if (!dto.email || dto.email.trim().length === 0) {
    throw new ValidationError('Email requerido');
  }

  if (!dto.username || dto.username.trim().length === 0) {
    throw new ValidationError('Nombre de usuario requerido');
  }

  if (!dto.password || dto.password.length < 6) {
    throw new ValidationError('Contraseña debe tener al menos 6 caracteres');
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(dto.email)) {
    throw new ValidationError('Formato de email inválido');
  }

  // Validar username (solo letras, números, guiones y guiones bajos)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(dto.username)) {
    throw new ValidationError('Username solo puede contener letras, números, guiones y guiones bajos');
  }

  if (dto.username.length < 3 || dto.username.length > 30) {
    throw new ValidationError('Username debe tener entre 3 y 30 caracteres');
  }

  if (dto.displayName && dto.displayName.length > 50) {
    throw new ValidationError('Display name no puede exceder 50 caracteres');
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}
