import { DomainError } from '../errors/DomainError';
import { Email } from '../value-objects/Email';
import { Money } from '../value-objects/Money';
import { Password } from '../value-objects/Password';
import { XP } from '../value-objects/XP';

export class UserAlreadyVerifiedError extends DomainError {
  readonly code = 'USER_ALREADY_VERIFIED';
  readonly isOperational = true;
  constructor() {
    super('El usuario ya está verificado');
  }
}

export class InsufficientPermissionsError extends DomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  readonly isOperational = true;
  constructor(required: string) {
    super(`Se requiere rol: ${required}`);
  }
}

export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN';

export interface UserProps {
  id: string;
  email: Email;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  passwordHash?: string;
  emailVerified?: Date;
  role?: UserRole;
  xpPoints?: number;
  inkcoinsBalance?: number;
  readingStreak?: number;
  lastReadAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class User {
  private _id: string;
  private _email: Email;
  private _username: string;
  private _displayName: string | undefined;
  private _avatarUrl: string | undefined;
  private _passwordHash: string | undefined;
  private _emailVerified: Date | undefined;
  private _role: UserRole;
  private _xp: XP;
  private _inkcoins: Money;
  private _readingStreak: number;
  private _lastReadAt: Date | undefined;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: UserDomainEvent[] = [];

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._username = props.username;
    this._displayName = props.displayName;
    this._avatarUrl = props.avatarUrl;
    this._passwordHash = props.passwordHash;
    this._emailVerified = props.emailVerified;
    this._role = props.role ?? 'USER';
    this._xp = XP.create(props.xpPoints ?? 0);
    this._inkcoins = Money.create(props.inkcoinsBalance ?? 0, 'INK');
    this._readingStreak = props.readingStreak ?? 0;
    this._lastReadAt = props.lastReadAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  // Factory methods
  static create(props: Omit<UserProps, 'id'> & { id?: string }): User {
    return new User({
      ...props,
      id: props.id ?? crypto.randomUUID(),
    });
  }

  static registerWithEmail(
    email: Email,
    username: string,
    password: Password
  ): { user: User; events: UserDomainEvent[] } {
    if (!password.plainText) {
      throw new Error('Se requiere contraseña en texto plano para registro');
    }

    const user = new User({
      id: crypto.randomUUID(),
      email,
      username: username.toLowerCase().trim(),
      xpPoints: 0,
      inkcoinsBalance: 50, // Bonus de registro
      readingStreak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // En producción, aquí se hashearía la contraseña
    // Por ahora guardamos el hash simulado
    user._passwordHash = `[HASHED]${password.plainText}`;

    user._domainEvents.push({
      type: 'USER_REGISTERED',
      payload: {
        userId: user._id,
        email: email.value,
        username: user._username,
        registrationBonus: 50,
      },
      occurredAt: new Date(),
    });

    return { user, events: [...user._domainEvents] };
  }

  static registerWithOAuth(
    email: Email,
    username: string,
    provider: string,
    providerAccountId: string
  ): { user: User; events: UserDomainEvent[] } {
    const user = new User({
      id: crypto.randomUUID(),
      email,
      username: username.toLowerCase().trim(),
      emailVerified: new Date(),
      xpPoints: 0,
      inkcoinsBalance: 50, // Bonus de registro
      readingStreak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user._domainEvents.push({
      type: 'USER_REGISTERED_OAUTH',
      payload: {
        userId: user._id,
        email: email.value,
        username: user._username,
        provider,
        providerAccountId,
        registrationBonus: 50,
      },
      occurredAt: new Date(),
    });

    return { user, events: [...user._domainEvents] };
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get username(): string {
    return this._username;
  }

  get displayName(): string | undefined {
    return this._displayName;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get emailVerified(): Date | undefined {
    return this._emailVerified;
  }

  get role(): UserRole {
    return this._role;
  }

  get xp(): XP {
    return this._xp;
  }

  get level(): number {
    return this._xp.level;
  }

  get rank(): string {
    return this._xp.rank;
  }

  get inkcoins(): Money {
    return this._inkcoins;
  }

  get readingStreak(): number {
    return this._readingStreak;
  }

  get lastReadAt(): Date | undefined {
    return this._lastReadAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Métodos de dominio
  verifyEmail(): void {
    if (this._emailVerified) {
      throw new UserAlreadyVerifiedError();
    }
    this._emailVerified = new Date();
    this._updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    this._role = newRole;
    this._updatedAt = new Date();
  }

  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  requireRole(role: UserRole): void {
    if (!this.hasRole(role)) {
      throw new InsufficientPermissionsError(role);
    }
  }

  updateProfile(updates: { displayName?: string; avatarUrl?: string }): void {
    if (updates.displayName !== undefined) {
      this._displayName = updates.displayName;
    }
    if (updates.avatarUrl !== undefined) {
      this._avatarUrl = updates.avatarUrl;
    }
    this._updatedAt = new Date();
  }

  // Gamificación
  addXP(xp: XP, reason: string): void {
    const oldLevel = this._xp.level;
    this._xp = this._xp.add(xp);
    this._updatedAt = new Date();

    const event: UserDomainEvent = {
      type: 'XP_EARNED',
      payload: {
        userId: this._id,
        amount: xp.amount,
        totalXP: this._xp.amount,
        reason,
        levelUp: this._xp.level > oldLevel,
        newLevel: this._xp.level,
      },
      occurredAt: new Date(),
    };

    this._domainEvents.push(event);

    if (this._xp.level > oldLevel) {
      this._domainEvents.push({
        type: 'LEVEL_UP',
        payload: {
          userId: this._id,
          oldLevel,
          newLevel: this._xp.level,
          newRank: this._xp.rank,
        },
        occurredAt: new Date(),
      });
    }
  }

  completeChapter(chapterId: string): void {
    const xpEarned = XP.fromChapterComplete();
    this.addXP(xpEarned, 'CHAPTER_COMPLETE');

    const now = new Date();

    // Actualizar streak ANTES de actualizar lastReadAt
    if (this._lastReadAt) {
      const lastRead = new Date(this._lastReadAt);
      const today = new Date();
      // Resetear horas para comparar solo fechas
      lastRead.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        this._readingStreak++;
      } else if (diffDays > 1) {
        this._readingStreak = 1; // Reset streak
      }
      // Si diffDays === 0, ya leyó hoy, no incrementamos
    } else {
      // Primera vez que lee
      this._readingStreak = 1;
    }

    this._lastReadAt = now;
    this._updatedAt = now;

    this._domainEvents.push({
      type: 'CHAPTER_COMPLETED',
      payload: {
        userId: this._id,
        chapterId,
        xpEarned: xpEarned.amount,
      },
      occurredAt: new Date(),
    });
  }

  postComment(chapterId: string): void {
    const xpEarned = XP.fromComment();
    this.addXP(xpEarned, 'COMMENT_POSTED');

    this._domainEvents.push({
      type: 'COMMENT_POSTED',
      payload: {
        userId: this._id,
        chapterId,
        xpEarned: xpEarned.amount,
      },
      occurredAt: new Date(),
    });
  }

  addInkCoins(amount: number, reason: string): void {
    const coins = Money.create(amount, 'INK');
    this._inkcoins = this._inkcoins.add(coins);
    this._updatedAt = new Date();

    this._domainEvents.push({
      type: 'INKCOINS_EARNED',
      payload: {
        userId: this._id,
        amount,
        balance: this._inkcoins.amount,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  spendInkCoins(amount: number, reason: string): void {
    const coins = Money.create(amount, 'INK');
    this._inkcoins = this._inkcoins.subtract(coins);
    this._updatedAt = new Date();

    this._domainEvents.push({
      type: 'INKCOINS_SPENT',
      payload: {
        userId: this._id,
        amount,
        balance: this._inkcoins.amount,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  // Eventos de dominio
  get domainEvents(): UserDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      email: this._email.value,
      username: this._username,
      displayName: this._displayName,
      avatarUrl: this._avatarUrl,
      emailVerified: this._emailVerified?.toISOString(),
      role: this._role,
      xpPoints: this._xp.amount,
      level: this._xp.level,
      rank: this._xp.rank,
      progressToNextLevel: this._xp.progressToNextLevel,
      inkcoinsBalance: this._inkcoins.amount,
      readingStreak: this._readingStreak,
      lastReadAt: this._lastReadAt?.toISOString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
