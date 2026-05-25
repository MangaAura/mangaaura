/**
 * Caso de uso: Gastar Aura
 * Verifica balance, crea transacción y actualiza el balance del usuario
 * @packageDocumentation
 */

import { DomainError } from '../../core/errors/DomainError';
import { AuraSpentEvent } from '../events/AuraSpentEvent';
import { IEventBus } from '../services/IEventBus';
import type { AuraTransactionType } from '../types/transaction-types';

/**
 * DTO de entrada para gastar Aura
 */
export interface SpendAuraInputDTO {
  /** ID del usuario */
  userId: string;
  /** Cantidad a gastar */
  amount: number;
  /** Tipo de transacción */
  type: AuraTransactionType;
  /** Descripción de la transacción */
  description: string;
  /** ID del manga relacionado (opcional) */
  mangaId?: string;
  /** ID del capítulo relacionado (opcional) */
  chapterId?: string;
  /** ID del receptor (para tips, opcional) */
  recipientId?: string;
}

/**
 * DTO de salida con el resultado de la transacción
 */
export interface SpendAuraOutputDTO {
  /** Si la transacción fue exitosa */
  success: boolean;
  /** Mensaje de resultado */
  message: string;
  /** Nuevo balance del usuario */
  newBalance: number;
  /** Monto gastado */
  amountSpent: number;
  /** ID de la transacción */
  transactionId?: string;
  /** Timestamp de la transacción */
  timestamp: string;
}

/**
 * Puerto del repositorio de transacciones
 */
export interface ITransactionRepository {
  create(data: {
    userId: string;
    amount: number;
    type: AuraTransactionType;
    description: string;
    mangaId?: string;
    chapterId?: string;
    recipientId?: string;
  }): Promise<{
    id: string;
    userId: string;
    amount: number;
    type: string;
    description: string;
    createdAt: Date;
  }>;
}

/**
 * Puerto del repositorio de usuarios (versión mínima para Aura)
 */
export interface IUserCoinsRepository {
  findById(id: string): Promise<{
    id: string;
    aura: { amount: number };
  } | null>;
  updateAura(userId: string, amount: number): Promise<number>;
}

/**
 * Caso de uso para gastar Aura
 */
export class SpendAuraUseCase {
  constructor(
    private readonly userRepo: IUserCoinsRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param input - Datos para la transacción
   * @returns Resultado de la operación
   * @throws DomainError si el balance es insuficiente o datos inválidos
   */
  async execute(input: SpendAuraInputDTO): Promise<SpendAuraOutputDTO> {
    // Validar datos de entrada
    this.validateInput(input);

    // Verificar que el usuario existe
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // Verificar balance suficiente
    const currentBalance = user.aura.amount;
    if (currentBalance < input.amount) {
      throw new InsufficientBalanceError(currentBalance, input.amount);
    }

    // Crear la transacción
    const transaction = await this.transactionRepo.create({
      userId: input.userId,
      amount: -input.amount, // Negativo porque es un gasto
      type: input.type,
      description: input.description,
      mangaId: input.mangaId,
      chapterId: input.chapterId,
      recipientId: input.recipientId,
    });

    // Actualizar balance del usuario (negativo para restar)
    const updatedBalance = await this.userRepo.updateAura(
      input.userId,
      -input.amount
    );

    // Publicar evento de Aura gastados
    await this.eventBus.publish(
      new AuraSpentEvent({
        userId: input.userId,
        amount: input.amount,
        type: input.type,
        description: input.description,
        newBalance: updatedBalance,
        transactionId: transaction.id,
        mangaId: input.mangaId,
        chapterId: input.chapterId,
        recipientId: input.recipientId,
      })
    );

    return {
      success: true,
      message: 'Transacción completada exitosamente',
      newBalance: updatedBalance,
      amountSpent: input.amount,
      transactionId: transaction.id,
      timestamp: transaction.createdAt.toISOString(),
    };
  }

  /**
   * Valida los datos de entrada
   * @param input - Datos a validar
   * @throws DomainError si los datos son inválidos
   */
  private validateInput(input: SpendAuraInputDTO): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
      throw new ValidationError('El monto debe ser un número válido');
    }

    if (!Number.isInteger(input.amount)) {
      throw new ValidationError('El monto debe ser un número entero');
    }

    if (input.amount <= 0) {
      throw new ValidationError('El monto debe ser positivo');
    }

    if (input.amount > 1_000_000) {
      throw new ValidationError('El monto no puede exceder 1,000,000 Aura');
    }

    if (!input.type) {
      throw new ValidationError('Tipo de transacción requerido');
    }

    const validTypes: AuraTransactionType[] = [
      'TIP_AUTHOR',
      'CROWDFUND_CONTRIBUTION',
      'PREMIUM_CHAPTER',
      'MARKETPLACE_PURCHASE',
      'BOOST_MANGA',
      'OTHER',
    ];

    if (!validTypes.includes(input.type)) {
      throw new ValidationError('Tipo de transacción inválido');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new ValidationError('Descripción de la transacción requerida');
    }

    if (input.description.length > 500) {
      throw new ValidationError('La descripción no puede exceder 500 caracteres');
    }

    // Validaciones específicas por tipo
    if (input.type === 'TIP_AUTHOR' && !input.recipientId) {
      throw new ValidationError('Se requiere recipientId para propinas a autores');
    }

    if (input.type === 'CROWDFUND_CONTRIBUTION' && !input.chapterId) {
      throw new ValidationError('Se requiere chapterId para contribuciones de crowdfunding');
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

/**
 * Error lanzado cuando el balance es insuficiente
 */
class InsufficientBalanceError extends DomainError {
  readonly code = 'INSUFFICIENT_BALANCE';
  readonly isOperational = true;
  constructor(currentBalance: number, requiredAmount: number) {
    super(
      `Balance insuficiente. Tienes ${currentBalance} Aura, ` +
      `se requieren ${requiredAmount} Aura`
    );
  }
}
