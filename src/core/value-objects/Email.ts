import { DomainError } from '../errors/DomainError';

export class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';
  readonly isOperational = true;

  constructor(email: string) {
    super(`El email "${email}" no es válido`);
  }
}

export class Email {
  private readonly _value: string;

  private constructor(email: string) {
    this._value = email.toLowerCase().trim();
  }

  static create(email: string): Email {
    const trimmed = email.trim();
    if (!Email.isValid(trimmed)) {
      throw new InvalidEmailError(email);
    }
    return new Email(trimmed);
  }

  static createOrNull(email: string): Email | null {
    try {
      return Email.create(email);
    } catch {
      return null;
    }
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  get value(): string {
    return this._value;
  }

  get domain(): string {
    return this._value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
