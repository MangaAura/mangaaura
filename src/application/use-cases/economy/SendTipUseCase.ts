import { DomainError } from '../../../core/errors/DomainError';
import { PaymentService } from '../../../core/services/PaymentService';

export interface SendTipInput {
  senderId: string;
  chapterId: string;
  amount: number;
  message?: string;
}

export interface SendTipOutput {
  success: boolean;
  newBalance: number;
  tip: {
    id: string;
    amount: number;
    chapterId: string;
    fromUserId: string;
    toUserId: string;
    message: string | null;
    createdAt: string;
  };
}

export class SendTipUseCase {
  constructor(private readonly paymentService: PaymentService) {}

  async execute(input: SendTipInput): Promise<SendTipOutput> {
    this.validateInput(input);

    const result = await this.paymentService.sendTip({
      chapterId: input.chapterId,
      fromUserId: input.senderId,
      amount: input.amount,
      message: input.message,
    });

    return {
      success: result.success,
      newBalance: result.newBalance,
      tip: {
        id: result.tip.id,
        amount: result.tip.amount,
        chapterId: result.tip.chapterId,
        fromUserId: result.tip.fromUserId,
        toUserId: result.tip.toUserId,
        message: result.tip.message,
        createdAt: result.tip.createdAt.toISOString(),
      },
    };
  }

  private validateInput(input: SendTipInput): void {
    if (!input.senderId || input.senderId.trim().length === 0) {
      throw new ValidationError('ID del remitente requerido');
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
      throw new ValidationError('El monto mínimo es 1 Aura');
    }

    if (input.amount > 1000) {
      throw new ValidationError('El monto no puede exceder 1000 Aura');
    }

    if (input.message && input.message.length > 200) {
      throw new ValidationError('El mensaje no puede exceder 200 caracteres');
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
