import { DomainError } from '../../../core/errors/DomainError';
import { PaymentService } from '../../../core/services/PaymentService';

export interface ContributeCrowdfundingInput {
  userId: string;
  chapterId: string;
  amount: number;
  isAnonymous?: boolean;
  message?: string;
}

export interface ContributeCrowdfundingOutput {
  success: boolean;
  contribution: {
    id: string;
    chapterId: string;
    userId: string;
    amount: number;
    isAnonymous: boolean;
    message: string | null;
    createdAt: string;
  };
  newTotal: number;
  goalReached: boolean;
}

export class ContributeCrowdfundingUseCase {
  constructor(private readonly paymentService: PaymentService) {}

  async execute(input: ContributeCrowdfundingInput): Promise<ContributeCrowdfundingOutput> {
    this.validateInput(input);

    const result = await this.paymentService.contributeToCrowdfunding({
      chapterId: input.chapterId,
      userId: input.userId,
      amount: input.amount,
      isAnonymous: input.isAnonymous,
      message: input.message,
    });

    return {
      success: result.success,
      contribution: {
        id: result.contribution.id,
        chapterId: result.contribution.chapterId,
        userId: result.contribution.userId,
        amount: result.contribution.amount,
        isAnonymous: result.contribution.isAnonymous,
        message: result.contribution.message,
        createdAt: result.contribution.createdAt.toISOString(),
      },
      newTotal: result.newTotal,
      goalReached: result.goalReached,
    };
  }

  private validateInput(input: ContributeCrowdfundingInput): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new ValidationError('ID del capítulo requerido');
    }

    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
      throw new ValidationError('El monto debe ser un número válido');
    }

    if (!Number.isInteger(input.amount)) {
      throw new ValidationError('El monto debe ser un número entero');
    }

    if (input.amount < 1) {
      throw new ValidationError('El monto mínimo es 1 InkCoin');
    }

    if (input.amount > 100000) {
      throw new ValidationError('El monto no puede exceder 100000 InkCoins');
    }

    if (input.message && input.message.length > 500) {
      throw new ValidationError('El mensaje no puede exceder 500 caracteres');
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
