import { DomainError } from '../errors/DomainError';

export class InvalidAmountError extends DomainError {
  readonly code = 'INVALID_AMOUNT';
  readonly isOperational = true;

  constructor(amount: number, reason: string) {
    super(`Cantidad inválida: ${amount}. ${reason}`);
  }
}

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly isOperational = true;

  constructor(current: number, required: number) {
    super(`Fondos insuficientes. Tienes: ${current}, necesitas: ${required}`);
  }
}

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string = 'INK') {
    this._amount = amount;
    this._currency = currency;
  }

  static create(amount: number, currency: string = 'INK'): Money {
    if (!Number.isInteger(amount)) {
      throw new InvalidAmountError(amount, 'Debe ser un número entero');
    }
    if (amount < 0) {
      throw new InvalidAmountError(amount, 'No puede ser negativo');
    }
    if (amount > 999_999_999) {
      throw new InvalidAmountError(amount, 'Excede el límite máximo');
    }
    return new Money(amount, currency);
  }

  static zero(currency: string = 'INK'): Money {
    return new Money(0, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new InvalidAmountError(
        other._amount,
        `Monedas diferentes: ${this._currency} vs ${other._currency}`
      );
    }
    return Money.create(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new InvalidAmountError(
        other._amount,
        `Monedas diferentes: ${this._currency} vs ${other._currency}`
      );
    }
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new InsufficientFundsError(this._amount, other._amount);
    }
    return Money.create(result, this._currency);
  }

  canSubtract(other: Money): boolean {
    if (this._currency !== other._currency) return false;
    return this._amount >= other._amount;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  isPositive(): boolean {
    return this._amount > 0;
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }
}
