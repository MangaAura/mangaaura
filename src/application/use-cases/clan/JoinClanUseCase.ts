import { DomainError } from '../../../core/errors/DomainError';

export interface JoinClanInput {
  clanId: string;
  userId: string;
}

export interface JoinClanOutput {
  membership: {
    id: string;
    clanId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    contributedScore: number;
  };
}

export interface IClanJoinRepository {
  findUserMembership(userId: string): Promise<{ clanId: string } | null>;
  findClanById(id: string): Promise<{ id: string } | null>;
  createMembership(data: { clanId: string; userId: string; role: string }): Promise<JoinClanOutput['membership']>;
}

export class JoinClanUseCase {
  constructor(private readonly clanRepo: IClanJoinRepository) {}

  async execute(input: JoinClanInput): Promise<JoinClanOutput> {
    const { clanId, userId } = input;

    const existingMembership = await this.clanRepo.findUserMembership(userId);
    if (existingMembership) {
      throw new AlreadyInClanError();
    }

    const clan = await this.clanRepo.findClanById(clanId);
    if (!clan) {
      throw new ClanNotFoundError(clanId);
    }

    const membership = await this.clanRepo.createMembership({
      clanId,
      userId,
      role: 'MEMBER',
    });

    return { membership };
  }
}

class AlreadyInClanError extends DomainError {
  readonly code = 'ALREADY_IN_CLAN';
  readonly isOperational = true;
  constructor() { super('El usuario ya pertenece a un clan'); }
}

class ClanNotFoundError extends DomainError {
  readonly code = 'CLAN_NOT_FOUND';
  readonly isOperational = true;
  constructor(id: string) { super(`Clan no encontrado: ${id}`); }
}