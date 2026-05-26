import { prisma } from '@/lib/prisma';

export interface WithdrawAuraInput {
  userId: string;
  amount: number;
}

export interface WithdrawAuraOutput {
  success: boolean;
  withdrawalId: string;
  amount: number;
  fee: number;
  netToUser: number;
  newBalance: number;
}

const CASHOUT_FEE_PERCENT = 0.30;
const MIN_CASHOUT = 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const PLATFORM_TREASURY_ID = 'platform_treasury';

export class WithdrawAuraUseCase {
  async execute(input: WithdrawAuraInput): Promise<WithdrawAuraOutput> {
    this.validateInput(input);

    const { userId, amount } = input;

    const fee = Math.floor(amount * CASHOUT_FEE_PERCENT);
    const netToUser = amount - fee;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          auraBalance: true,
          auraFirstPurchaseAt: true,
          kycStatus: true,
          kycVerifiedAt: true,
        },
      });

      if (!user) {
        throw new WithdrawError('Usuario no encontrado', 'USER_NOT_FOUND');
      }

      if (user.kycStatus !== 'approved') {
        throw new WithdrawError(
          'Identidad no verificada. Completa la verificación KYC primero.',
          'KYC_NOT_APPROVED'
        );
      }

      if (!user.auraFirstPurchaseAt) {
        throw new WithdrawError(
          'No has realizado ninguna compra aún',
          'NO_PURCHASE_HISTORY'
        );
      }

      const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
      if (user.auraFirstPurchaseAt > thirtyDaysAgo) {
        const daysRemaining = Math.ceil(
          (user.auraFirstPurchaseAt.getTime() + THIRTY_DAYS_MS - Date.now()) / (24 * 60 * 60 * 1000)
        );
        throw new WithdrawError(
          `Debes esperar ${daysRemaining} días más desde tu primera compra para retirar`,
          'THIRTY_DAY_HOLD'
        );
      }

      if (user.auraBalance < amount) {
        throw new WithdrawError('Saldo insuficiente', 'INSUFFICIENT_BALANCE');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          auraBalance: { decrement: amount },
          auraLifetimeWithdrawn: { increment: amount },
        },
      });

      await tx.user.update({
        where: { id: PLATFORM_TREASURY_ID },
        data: {
          auraBalance: { increment: fee },
        },
      });

      const withdrawal = await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'CASH_OUT',
          description: `Retiro de ${amount} Aura (-${fee} comisión 30%)`,
        },
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { auraBalance: true },
      });

      return {
        withdrawalId: withdrawal.id,
        amount,
        fee,
        netToUser,
        newBalance: updatedUser?.auraBalance || 0,
      };
    });

    return {
      success: true,
      ...result,
    };
  }

  private validateInput(input: WithdrawAuraInput): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (typeof input.amount !== 'number' || !Number.isFinite(input.amount)) {
      throw new ValidationError('El monto debe ser un número válido');
    }

    if (!Number.isInteger(input.amount)) {
      throw new ValidationError('El monto debe ser un número entero');
    }

    if (input.amount < MIN_CASHOUT) {
      throw new ValidationError(`El monto mínimo de retiro es ${MIN_CASHOUT} Aura`);
    }
  }
}

class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class WithdrawError extends Error {
  readonly code: string;
  readonly isOperational = true;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}