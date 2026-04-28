import { DomainError } from '../errors/DomainError';

export class InvalidXPError extends DomainError {
  readonly code = 'INVALID_XP';
  readonly isOperational = true;

  constructor(amount: number, reason: string) {
    super(`XP inválido: ${amount}. ${reason}`);
  }
}

export class XP {
  private readonly _amount: number;

  private constructor(amount: number) {
    this._amount = amount;
  }

  static create(amount: number): XP {
    if (!Number.isInteger(amount)) {
      throw new InvalidXPError(amount, 'Debe ser un número entero');
    }
    if (amount < 0) {
      throw new InvalidXPError(amount, 'No puede ser negativo');
    }
    if (amount > 999_999_999) {
      throw new InvalidXPError(amount, 'Excede el límite máximo');
    }
    return new XP(amount);
  }

  static zero(): XP {
    return new XP(0);
  }

  static fromChapterComplete(): XP {
    return new XP(2); // +2 XP por capítulo
  }

  static fromComment(): XP {
    return new XP(5); // +5 XP por comentario
  }

  static fromCorrection(): XP {
    return new XP(20); // +20 XP por corrección aprobada
  }

  static fromAchievement(xpReward: number): XP {
    return new XP(xpReward);
  }

  get amount(): number {
    return this._amount;
  }

  get level(): number {
    // Nivel = 1 + XP / 1000 (cada 1000 XP = 1 nivel)
    return Math.floor(this._amount / 1000) + 1;
  }

  get xpToNextLevel(): number {
    const nextLevelXP = this.level * 1000;
    const remaining = nextLevelXP - this._amount;
    return remaining === 1000 ? 0 : remaining; // Si está justo en el límite
  }

  get progressToNextLevel(): number {
    const currentLevelXP = (this.level - 1) * 1000;
    const nextLevelXP = this.level * 1000;
    const progress = (this._amount - currentLevelXP) / (nextLevelXP - currentLevelXP);
    return Math.round(progress * 100);
  }

  get rank(): string {
    const lvl = this.level;
    if (lvl < 2) return 'Novato';
    if (lvl < 4) return 'Lector Shonen';
    if (lvl < 7) return 'Otaku Experto';
    if (lvl < 10) return 'Maestro Otaku';
    return 'Leyenda Manga';
  }

  // Método estático para verificar rangos en tests
  static getRankForLevel(level: number): string {
    if (level < 2) return 'Novato';
    if (level < 4) return 'Lector Shonen';
    if (level < 7) return 'Otaku Experto';
    if (level < 10) return 'Maestro Otaku';
    return 'Leyenda Manga';
  }

  add(other: XP): XP {
    return XP.create(this._amount + other._amount);
  }

  equals(other: XP): boolean {
    return this._amount === other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  greaterThan(other: XP): boolean {
    return this._amount > other._amount;
  }

  toString(): string {
    return `${this._amount} XP (Nivel ${this.level} - ${this.rank})`;
  }
}
