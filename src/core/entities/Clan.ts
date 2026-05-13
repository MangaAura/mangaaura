export type ClanMemberRole = 'LEADER' | 'OFFICER' | 'MEMBER';

export interface ClanMemberProps {
  userId: string;
  username?: string;
  avatarUrl?: string;
  xpPoints?: number;
  level?: number;
  role: ClanMemberRole;
  joinedAt: Date;
}

export interface ClanProps {
  id: string;
  name: string;
  description?: string;
  emblemUrl?: string;
  leaderId: string;
  totalScore?: number;
  monthlyScore?: number;
  currentSeason?: number;
  members?: ClanMemberProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClanDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class Clan {
  private _id: string;
  private _name: string;
  private _description: string | undefined;
  private _emblemUrl: string | undefined;
  private _leaderId: string;
  private _totalScore: number;
  private _monthlyScore: number;
  private _currentSeason: number;
  private _members: ClanMemberProps[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: ClanDomainEvent[] = [];

  constructor(props: ClanProps) {
    this._id = props.id;
    this._name = props.name;
    this._description = props.description;
    this._emblemUrl = props.emblemUrl;
    this._leaderId = props.leaderId;
    this._totalScore = props.totalScore ?? 0;
    this._monthlyScore = props.monthlyScore ?? 0;
    this._currentSeason = props.currentSeason ?? 1;
    this._members = props.members ?? [];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: Omit<ClanProps, 'id'> & { id?: string }): { clan: Clan; events: ClanDomainEvent[] } {
    const id = props.id ?? crypto.randomUUID();

    const clan = new Clan({
      ...props,
      id,
      members: [{
        userId: props.leaderId,
        role: 'LEADER',
        joinedAt: new Date(),
      }],
    });

    clan._domainEvents.push({
      type: 'CLAN_CREATED',
      payload: {
        clanId: id,
        name: props.name,
        leaderId: props.leaderId,
      },
      occurredAt: new Date(),
    });

    return { clan, events: [...clan._domainEvents] };
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get emblemUrl(): string | undefined { return this._emblemUrl; }
  get leaderId(): string { return this._leaderId; }
  get totalScore(): number { return this._totalScore; }
  get monthlyScore(): number { return this._monthlyScore; }
  get currentSeason(): number { return this._currentSeason; }
  get members(): ClanMemberProps[] { return [...this._members]; }
  get memberCount(): number { return this._members.length; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  hasMember(userId: string): boolean {
    return this._members.some(m => m.userId === userId);
  }

  joinMember(userId: string): void {
    if (this.hasMember(userId)) {
      throw new Error('El usuario ya es miembro del clan');
    }

    this._members.push({
      userId,
      role: 'MEMBER',
      joinedAt: new Date(),
    });

    this._domainEvents.push({
      type: 'CLAN_MEMBER_JOINED',
      payload: { clanId: this._id, userId },
      occurredAt: new Date(),
    });
  }

  leaveMember(userId: string): void {
    if (userId === this._leaderId) {
      throw new Error('El l\u00edder no puede abandonar el clan');
    }
    this._members = this._members.filter(m => m.userId !== userId);

    this._domainEvents.push({
      type: 'CLAN_MEMBER_LEFT',
      payload: { clanId: this._id, userId },
      occurredAt: new Date(),
    });
  }

  addScore(amount: number): void {
    this._totalScore += amount;
    this._monthlyScore += amount;
    this._updatedAt = new Date();
  }

  resetMonthlyScore(): void {
    this._monthlyScore = 0;
    this._currentSeason++;
    this._updatedAt = new Date();
  }

  promoteMember(userId: string, newRole: ClanMemberRole): void {
    const member = this._members.find(m => m.userId === userId);
    if (!member) throw new Error('Miembro no encontrado');
    member.role = newRole;
  }

  transferLeadership(newLeaderId: string): void {
    if (!this.hasMember(newLeaderId)) {
      throw new Error('El nuevo l\u00edder debe ser miembro del clan');
    }

    const oldLeader = this._members.find(m => m.userId === this._leaderId);
    const newLeader = this._members.find(m => m.userId === newLeaderId);

    if (oldLeader) oldLeader.role = 'MEMBER';
    if (newLeader) newLeader.role = 'LEADER';

    this._leaderId = newLeaderId;
    this._updatedAt = new Date();
  }

  get domainEvents(): ClanDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      emblemUrl: this._emblemUrl,
      leaderId: this._leaderId,
      totalScore: this._totalScore,
      monthlyScore: this._monthlyScore,
      currentSeason: this._currentSeason,
      memberCount: this._members.length,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}