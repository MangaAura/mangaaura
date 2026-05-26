import { prisma } from '@/lib/prisma';

export interface ClaimReferralBonusInput {
  referrerId: string;
  refereeId: string;
}

export interface ClaimReferralBonusOutput {
  success: boolean;
  bonusAmount: number;
  newBalance: number;
}

export class ClaimReferralBonusUseCase {
  async execute(input: ClaimReferralBonusInput): Promise<ClaimReferralBonusOutput> {
    const { referrerId, refereeId } = input;

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.referralClaim.findUnique({
        where: {
          referrerId_refereeId: {
            referrerId,
            refereeId,
          },
        },
      });

      if (!claim) {
        throw new ReferralError('Reclamación no encontrada', 'CLAIM_NOT_FOUND');
      }

      if (claim.status === 'claimed') {
        throw new ReferralError('Este bono ya fue reclamado', 'ALREADY_CLAIMED');
      }

      if (claim.status === 'locked') {
        throw new ReferralError('El Referral aún no ha realizado una compra válida', 'NOT_UNLOCKED');
      }

      if (claim.bonusAwarded <= 0) {
        throw new ReferralError('No hay bono disponible', 'NO_BONUS');
      }

      const referrer = await tx.user.findUnique({
        where: { id: referrerId },
        select: { auraLifetimePurchased: true, auraBalance: true },
      });

      if (!referrer) {
        throw new ReferralError('Usuario referidor no encontrado', 'REFERRER_NOT_FOUND');
      }

      if (referrer.auraLifetimePurchased <= 0) {
        throw new ReferralError(
          'Debes realizar una compra para reclamar el bono de referido',
          'REFERRER_NOT_PURCHASED'
        );
      }

      await tx.user.update({
        where: { id: referrerId },
        data: {
          auraBalance: { increment: claim.bonusAwarded },
        },
      });

      await tx.referralClaim.update({
        where: { id: claim.id },
        data: {
          status: 'claimed',
          claimedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: referrerId,
          amount: claim.bonusAwarded,
          type: 'REFERRAL_BONUS',
          referenceId: claim.id,
          description: `Bono de referido por primera compra de usuario ${refereeId}`,
        },
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: referrerId },
        select: { auraBalance: true },
      });

      return {
        bonusAmount: claim.bonusAwarded,
        newBalance: updatedUser?.auraBalance || 0,
      };
    });

    return {
      success: true,
      ...result,
    };
  }
}

class ReferralError extends Error {
  readonly code: string;
  readonly isOperational = true;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}