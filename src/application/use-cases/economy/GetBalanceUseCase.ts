import { DomainError } from '../../../core/errors/DomainError';
import { PaymentService } from '../../../core/services/PaymentService';

export interface IUserBalanceRepository {
  findById(id: string): Promise<{
    id: string;
    xp: { amount: number; level: number; rank: string; progressToNextLevel: number };
  } | null>;
}

export interface GetBalanceInput {
  userId: string;
}

export interface BalanceStats {
  tips: {
    totalGiven: number;
    totalReceived: number;
    countGiven: number;
    countReceived: number;
  };
  crowdfunding: {
    totalRaised: number;
    totalContributors: number;
    activeCampaigns: number;
    completedCampaigns: number;
  };
}

export interface GetBalanceOutput {
  aura: number;
  xp: number;
  level: number;
  rank: string;
  progressToNextLevel: number;
  stats: BalanceStats;
}

export class GetBalanceUseCase {
  constructor(
    private readonly userRepo: IUserBalanceRepository,
    private readonly paymentService: PaymentService
  ) {}

  async execute(input: GetBalanceInput): Promise<GetBalanceOutput> {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    const [aura, tipStats, crowdfundingStats] = await Promise.all([
      this.paymentService.getUserBalance(input.userId),
      this.paymentService.getUserTipStats(input.userId),
      this.paymentService.getUserCrowdfundingStats(input.userId),
    ]);

    return {
      aura,
      xp: user.xp.amount,
      level: user.xp.level,
      rank: user.xp.rank,
      progressToNextLevel: user.xp.progressToNextLevel,
      stats: {
        tips: tipStats,
        crowdfunding: crowdfundingStats,
      },
    };
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}
