import { DomainError } from '../../../core/errors/DomainError';

export interface UpdateClanScoreInput {
  clanId: string;
  userId: string;
  scoreToAdd: number;
}

export interface UpdateClanScoreOutput {
  clan: {
    id: string;
    totalScore: number;
    monthlyScore: number;
  };
  membership: {
    id: string;
    contributedScore: number;
  };
}

export interface IClanScoreRepository {
  findMembership(clanId: string, userId: string): Promise<{ id: string; contributedScore: number } | null>;
  addScore(clanId: string, membershipId: string, scoreToAdd: number): Promise<UpdateClanScoreOutput>;
}

export class UpdateClanScoreUseCase {
  constructor(private readonly clanRepo: IClanScoreRepository) {}

  async execute(input: UpdateClanScoreInput): Promise<UpdateClanScoreOutput> {
    const { clanId, userId, scoreToAdd } = input;

    if (scoreToAdd <= 0) {
      throw new InvalidScoreError();
    }

    const membership = await this.clanRepo.findMembership(clanId, userId);
    if (!membership) {
      throw new NotMemberError();
    }

    return this.clanRepo.addScore(clanId, membership.id, scoreToAdd);
  }
}

class NotMemberError extends DomainError {
  readonly code = 'NOT_CLAN_MEMBER';
  readonly isOperational = true;
  constructor() { super('El usuario no es miembro de este clan'); }
}

class InvalidScoreError extends DomainError {
  readonly code = 'INVALID_SCORE';
  readonly isOperational = true;
  constructor() { super('El score debe ser mayor a 0'); }
}