import { DomainError } from '../../../core/errors/DomainError';
import { IEventBus } from '../../services/IEventBus';

export interface CreateClanInput {
  name: string;
  description?: string;
  emblemUrl?: string;
  leaderId: string;
}

export interface CreateClanOutput {
  clan: {
    id: string;
    name: string;
    description: string | null;
    emblemUrl: string | null;
    totalScore: number;
    monthlyScore: number;
    currentSeason: number;
    leaderId: string | null;
    createdAt: Date;
  };
}

export interface IClanRepository {
  findByName(name: string): Promise<{ id: string } | null>;
  findUserMembership(userId: string): Promise<{ clanId: string } | null>;
  create(data: {
    name: string;
    description?: string | null;
    emblemUrl?: string | null;
    leaderId: string;
  }): Promise<CreateClanOutput['clan']>;
  createMembership(data: { clanId: string; userId: string; role: string }): Promise<void>;
}

export class CreateClanUseCase {
  constructor(
    private readonly clanRepo: IClanRepository,
    private readonly eventBus?: IEventBus
  ) {}

  async execute(input: CreateClanInput): Promise<CreateClanOutput> {
    const { name, description, emblemUrl, leaderId } = input;

    const existingMembership = await this.clanRepo.findUserMembership(leaderId);
    if (existingMembership) {
      throw new AlreadyInClanError();
    }

    const existingClan = await this.clanRepo.findByName(name.trim());
    if (existingClan) {
      throw new ClanNameExistsError(name);
    }

    const clan = await this.clanRepo.create({
      name: name.trim(),
      description: description?.trim() ?? null,
      emblemUrl: emblemUrl?.trim() ?? null,
      leaderId,
    });

    await this.clanRepo.createMembership({
      clanId: clan.id,
      userId: leaderId,
      role: 'LEADER',
    });

    if (this.eventBus) {
      await this.eventBus.publish({
        id: crypto.randomUUID(),
        type: 'CLAN_CREATED',
        payload: { clanId: clan.id, name, leaderId },
        occurredAt: new Date(),
      } as never);
    }

    return { clan };
  }
}

class AlreadyInClanError extends DomainError {
  readonly code = 'ALREADY_IN_CLAN';
  readonly isOperational = true;
  constructor() { super('El usuario ya pertenece a un clan'); }
}

class ClanNameExistsError extends DomainError {
  readonly code = 'CLAN_NAME_EXISTS';
  readonly isOperational = true;
  constructor(name: string) { super(`El nombre de clan "${name}" ya existe`); }
}