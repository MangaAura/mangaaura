import { prisma } from '@/lib/prisma';

export interface TransferAuraInput {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface TransferAuraOutput {
  success: boolean;
  transferId: string;
  burnedAmount: number;
  netAmount: number;
  newBalance: number;
  transferQuotaRemaining: number;
}

const TRANSFER_FEE_PERCENT = 0.03;
const PLATFORM_TREASURY_ID = 'platform_treasury';

async function ensureTreasuryUserExists(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: PLATFORM_TREASURY_ID },
    select: { id: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        id: PLATFORM_TREASURY_ID,
        email: 'treasury@mangaaura.com',
        username: 'platform_treasury',
        role: 'SYSTEM',
        auraBalance: 0,
      },
    });
  }
}

export class TransferAuraUseCase {
  async execute(input: TransferAuraInput): Promise<TransferAuraOutput> {
    this.validateInput(input);

    await ensureTreasuryUserExists();

    const { fromUserId, toUserId, amount } = input;

    const burnedAmount = Math.floor(amount * TRANSFER_FEE_PERCENT);
    const netAmount = amount - burnedAmount;

    const result = await prisma.$transaction(async (tx) => {
      const fromUser = await tx.user.findUnique({
        where: { id: fromUserId },
        select: {
          id: true,
          auraBalance: true,
          auraLifetimePurchased: true,
          auraLifetimeTransferred: true,
          auraLifetimeWithdrawn: true,
          transferLockUntil: true,
        },
      });

      if (!fromUser) {
        throw new TransferError('Usuario remitente no encontrado', 'USER_NOT_FOUND');
      }

      if (fromUser.transferLockUntil && fromUser.transferLockUntil > new Date()) {
        throw new TransferError('Transferencias bloqueadas temporalmente', 'TRANSFER_LOCKED');
      }

      const toUser = await tx.user.findUnique({
        where: { id: toUserId },
        select: { id: true },
      });

      if (!toUser) {
        throw new TransferError('Usuario destinatario no encontrado', 'RECIPIENT_NOT_FOUND');
      }

      const transferQuota =
        fromUser.auraLifetimePurchased -
        fromUser.auraLifetimeTransferred -
        fromUser.auraLifetimeWithdrawn;

      if (amount > transferQuota) {
        throw new TransferError(
          `Saldo de transferencia insuficiente. Disponible: ${transferQuota} Aura (solo el Aura purchased puede transferirse fuera)`,
          'INSUFFICIENT_TRANSFER_QUOTA'
        );
      }

      if (fromUser.auraBalance < amount) {
        throw new TransferError('Saldo insuficiente', 'INSUFFICIENT_BALANCE');
      }

      await tx.user.update({
        where: { id: fromUserId },
        data: {
          auraBalance: { decrement: amount },
          auraLifetimeTransferred: { increment: amount },
        },
      });

      await tx.user.update({
        where: { id: toUserId },
        data: {
          auraBalance: { increment: netAmount },
        },
      });

      await tx.user.update({
        where: { id: PLATFORM_TREASURY_ID },
        data: {
          auraBalance: { increment: burnedAmount },
        },
      });

      const transfer = await tx.auraTransfer.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          burnedAmount,
          netAmount,
        },
      });

      await tx.transaction.createMany({
        data: [
          {
            userId: fromUserId,
            amount: -amount,
            type: 'TRANSFER_SENT',
            referenceId: transfer.id,
            description: `Enviaste ${amount} Aura (-${burnedAmount} comisión 3%)`,
          },
          {
            userId: toUserId,
            amount: netAmount,
            type: 'TRANSFER_RECEIVED',
            referenceId: transfer.id,
            description: `Recibiste ${netAmount} Aura de ${fromUserId}`,
          },
        ],
      });

      const updatedFromUser = await tx.user.findUnique({
        where: { id: fromUserId },
        select: {
          auraBalance: true,
          auraLifetimePurchased: true,
          auraLifetimeTransferred: true,
          auraLifetimeWithdrawn: true,
        },
      });

      const newTransferQuota =
        (updatedFromUser?.auraLifetimePurchased || 0) -
        (updatedFromUser?.auraLifetimeTransferred || 0) -
        (updatedFromUser?.auraLifetimeWithdrawn || 0);

      return {
        transferId: transfer.id,
        burnedAmount,
        netAmount,
        newBalance: updatedFromUser?.auraBalance || 0,
        transferQuotaRemaining: newTransferQuota,
      };
    });

    return {
      success: true,
      ...result,
    };
  }

  private validateInput(input: TransferAuraInput): void {
    if (!input.fromUserId || input.fromUserId.trim().length === 0) {
      throw new ValidationError('ID del remitente requerido');
    }

    if (!input.toUserId || input.toUserId.trim().length === 0) {
      throw new ValidationError('ID del destinatario requerido');
    }

    if (input.fromUserId === input.toUserId) {
      throw new ValidationError('No puedes enviarte Aura a ti mismo');
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
  }
}

class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class TransferError extends Error {
  readonly code: string;
  readonly isOperational = true;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}