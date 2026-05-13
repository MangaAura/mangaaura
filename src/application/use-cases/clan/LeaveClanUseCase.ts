import { DomainError } from '../../../core/errors/DomainError';

export interface LeaveClanInput {
  clanId: string;
  userId: string;
}

export interface LeaveClanOutput {
  success: boolean;
  clanDeleted?: boolean;
}

export interface IClanLeaveRepository {
  findMembership(clanId: string, userId: string): Promise<{ id: string; role: string } | null>;
  countMembers(clanId: string): Promise<number>;
  deleteClan(clanId: string): Promise<void>;
  deleteMembership(membershipId: string): Promise<void>;
}

export class LeaveClanUseCase {
  constructor(private readonly clanRepo: IClanLeaveRepository) {}

  async execute(input: LeaveClanInput): Promise<LeaveClanOutput> {
    const { clanId, userId } = input;

    const membership = await this.clanRepo.findMembership(clanId, userId);
    if (!membership) {
      throw new NotMemberError();
    }

    if (membership.role === 'LEADER') {
      const memberCount = await this.clanRepo.countMembers(clanId);
      if (memberCount === 1) {
        await this.clanRepo.deleteClan(clanId);
        return { success: true, clanDeleted: true };
      }
      throw new LeaderCannotLeaveError();
    }

    await this.clanRepo.deleteMembership(membership.id);
    return { success: true };
  }
}

class NotMemberError extends DomainError {
  readonly code = 'NOT_CLAN_MEMBER';
  readonly isOperational = true;
  constructor() { super('El usuario no es miembro de este clan'); }
}

class LeaderCannotLeaveError extends DomainError {
  readonly code = 'LEADER_CANNOT_LEAVE';
  readonly isOperational = true;
  constructor() { super('El l\u00edder debe transferir el liderazgo antes de salir'); }
}