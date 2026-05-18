/**
 * Caso de uso: Agregar XP a un usuario
 * Agrega puntos de experiencia y verifica si subió de nivel
 * @packageDocumentation
 */

import { DomainError } from '../../core/errors/DomainError';
import { XP } from '../../core/value-objects/XP';
import { XPAddedEvent , LevelUpEvent } from '../events/XPAddedEvent';
import { IEventBus } from '../services/IEventBus';

/**
 * DTO de entrada para agregar XP
 */
export interface AddXPInputDTO {
  /** ID del usuario */
  userId: string;
  /** Cantidad de XP a agregar */
  amount: number;
  /** Fuente de los puntos (ej: CHAPTER_COMPLETE, COMMENT_POSTED) */
  source: string;
  /** Descripción adicional (opcional) */
  description?: string;
}

/**
 * DTO de salida con el resultado de agregar XP
 */
export interface AddXPOutputDTO {
  /** XP previo del usuario */
  previousXP: number;
  /** Nuevo XP total del usuario */
  newXP: number;
  /** Nivel anterior */
  previousLevel: number;
  /** Nuevo nivel */
  newLevel: number;
  /** XP necesario para el siguiente nivel */
  xpToNextLevel: number;
  /** Progreso hacia el siguiente nivel (0-100) */
  progressToNextLevel: number;
  /** Si subió de nivel */
  levelUp: boolean;
  /** Nombre del rango anterior */
  previousRank: string;
  /** Nombre del nuevo rango */
  newRank: string;
  /** XP ganado en esta operación */
  xpGained: number;
}

/**
 * Puerto del repositorio de usuarios (versión mínima para XP)
 */
export interface IUserXRepository {
  findById(id: string): Promise<{
    id: string;
    xp: { amount: number; level: number };
  } | null>;
  updateXP(userId: string, amount: number): Promise<number>;
}

/**
 * Caso de uso para agregar XP a un usuario
 */
export class AddXPUseCase {


  constructor(
    private readonly userRepo: IUserXRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param input - Datos para agregar XP
   * @returns Resultado de la operación incluyendo si subió de nivel
   * @throws DomainError si los datos son inválidos
   */
  async execute(input: AddXPInputDTO): Promise<AddXPOutputDTO> {
    // Validar datos de entrada
    this.validateInput(input);

    // Verificar que el usuario existe
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const previousXP = user.xp.amount;
    const previousLevel = user.xp.level;

    // Calcular XP y niveles
    const previousRank = XP.getRankForLevel(previousLevel);
    
    // Agregar XP usando el value object
    const xpVO = XP.create(previousXP);
    const xpToAdd = XP.create(input.amount);
    const newXPVO = xpVO.add(xpToAdd);
    
    const newXP = newXPVO.amount;
    const newLevel = newXPVO.level;
    const newRank = newXPVO.rank;
    const xpToNextLevel = newXPVO.xpToNextLevel;
    const progressToNextLevel = newXPVO.progressToNextLevel;
    
    // Actualizar en repositorio
    await this.userRepo.updateXP(input.userId, input.amount);

    // Verificar si subió de nivel
    const levelUp = newLevel > previousLevel;

    // Publicar evento de XP agregado
    await this.eventBus.publish(
      new XPAddedEvent({
        userId: input.userId,
        amount: input.amount,
        source: input.source,
        totalXP: newXP,
        level: newLevel,
        description: input.description,
      })
    );

    // Si subió de nivel, emitir evento LEVEL_UP
    if (levelUp) {
      await this.eventBus.publish(
        new LevelUpEvent({
          userId: input.userId,
          oldLevel: previousLevel,
          newLevel: newLevel,
          oldRank: previousRank,
          newRank: newRank,
          xpAtLevelUp: newXP,
        })
      );
    }

    return {
      previousXP,
      newXP,
      previousLevel,
      newLevel,
      xpToNextLevel,
      progressToNextLevel,
      levelUp,
      previousRank,
      newRank,
      xpGained: input.amount,
    };
  }

  /**
   * Valida los datos de entrada
   * @param input - Datos a validar
   * @throws DomainError si los datos son inválidos
   */
  private validateInput(input: AddXPInputDTO): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
      throw new ValidationError('La cantidad de XP debe ser un número válido');
    }

    if (!Number.isInteger(input.amount)) {
      throw new ValidationError('La cantidad de XP debe ser un número entero');
    }

    if (input.amount <= 0) {
      throw new ValidationError('La cantidad de XP debe ser positiva');
    }

    if (input.amount > 10000) {
      throw new ValidationError('La cantidad de XP no puede exceder 10000');
    }

    if (!input.source || input.source.trim().length === 0) {
      throw new ValidationError('La fuente de XP es requerida');
    }

    if (input.description && input.description.length > 500) {
      throw new ValidationError('La descripción no puede exceder 500 caracteres');
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
 * Error lanzado cuando el usuario no es encontrado
 */
class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}
