/**
 * Caso de uso: Registrar usuario
 * Crea un nuevo usuario validando unicidad y asignando InkCoins iniciales
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { Email } from '../../../core/value-objects/Email';
import { Password } from '../../../core/value-objects/Password';
import { IUserRepository } from '../../ports/IUserRepository';
import { IEventBus } from '../../services/IEventBus';
import { UserRegisteredEvent } from '../../events/UserRegisteredEvent';
import { UserResponseDTO, mapUserToResponseDTO } from '../../dtos/user/UserResponseDTO';

/**
 * DTO de entrada para registrar usuario
 */
export interface RegisterUserInputDTO {
  /** Email del usuario */
  email: string;
  /** Nombre de usuario */
  username: string;
  /** Contraseña en texto plano */
  password: string;
  /** Nombre para mostrar (opcional) */
  displayName?: string;
}

/**
 * DTO de salida con el usuario registrado
 */
export interface RegisterUserOutputDTO {
  /** Usuario creado */
  user: UserResponseDTO;
  /** InkCoins de registro otorgados */
  registrationBonus: number;
  /** Token de verificación (si aplica) */
  verificationToken?: string;
}

/**
 * Puerto para hashing de contraseñas
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/**
 * Caso de uso para registrar un usuario
 */
export class RegisterUserUseCase {
  /** InkCoins iniciales para nuevos usuarios */
  private readonly INITIAL_INKCOINS = 50;

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param input - Datos del usuario a registrar
   * @returns Usuario registrado con bonus
   * @throws DomainError si el email o username ya existen, o datos inválidos
   */
  async execute(input: RegisterUserInputDTO): Promise<RegisterUserOutputDTO> {
    // Validar datos de entrada
    this.validateInput(input);

    // Crear value objects para validación
    const emailVO = Email.create(input.email);
    const passwordVO = Password.createFromPlain(input.password);

    // Verificar que el email sea único
    const emailExists = await this.userRepo.existsByEmail(input.email.toLowerCase().trim());
    if (emailExists) {
      throw new EmailAlreadyExistsError(input.email);
    }

    // Verificar que el username sea único
    const usernameExists = await this.userRepo.existsByUsername(
      input.username.toLowerCase().trim()
    );
    if (usernameExists) {
      throw new UsernameAlreadyExistsError(input.username);
    }

    // Hashear la contraseña
    const passwordHash = await this.passwordHasher.hash(passwordVO.plainText!);

    // Crear el usuario
    const user = await this.userRepo.create({
      email: emailVO.value,
      username: input.username.toLowerCase().trim(),
      passwordHash,
      displayName: input.displayName,
      inkcoinsBalance: this.INITIAL_INKCOINS,
    });

    // Publicar evento de usuario registrado
    await this.eventBus.publish(
      new UserRegisteredEvent({
        userId: user.id,
        email: emailVO.value,
        username: user.username,
        provider: 'email',
        registrationBonus: this.INITIAL_INKCOINS,
      })
    );

    return {
      user: mapUserToResponseDTO(user),
      registrationBonus: this.INITIAL_INKCOINS,
    };
  }

  /**
   * Valida los datos de entrada
   * @param input - Datos a validar
   * @throws DomainError si los datos son inválidos
   */
  private validateInput(input: RegisterUserInputDTO): void {
    if (!input.email || input.email.trim().length === 0) {
      throw new ValidationError('Email requerido');
    }

    if (!input.username || input.username.trim().length === 0) {
      throw new ValidationError('Nombre de usuario requerido');
    }

    if (!input.password || input.password.length === 0) {
      throw new ValidationError('Contraseña requerida');
    }

    // Validaciones adicionales de longitud
    if (input.username.length < 3 || input.username.length > 30) {
      throw new ValidationError('El nombre de usuario debe tener entre 3 y 30 caracteres');
    }

    if (input.displayName && input.displayName.length > 50) {
      throw new ValidationError('El nombre para mostrar no puede exceder 50 caracteres');
    }
  }
}

/**
 * Error de validación
 */
class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error cuando el email ya existe
 */
class EmailAlreadyExistsError extends DomainError {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly isOperational = true;
  constructor(email: string) {
    super(`El email ${email} ya está registrado`);
  }
}

/**
 * Error cuando el username ya existe
 */
class UsernameAlreadyExistsError extends DomainError {
  readonly code = 'USERNAME_ALREADY_EXISTS';
  readonly isOperational = true;
  constructor(username: string) {
    super(`El nombre de usuario ${username} ya está en uso`);
  }
}
