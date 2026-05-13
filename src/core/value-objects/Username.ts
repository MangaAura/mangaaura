import { DomainError } from '../errors/DomainError';

export class InvalidUsernameError extends DomainError {
  readonly code = 'INVALID_USERNAME';
  readonly isOperational = true;

  constructor(username: string) {
    super(`El nombre de usuario "${username}" no es válido`);
  }
}

export class Username {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Username {
    const trimmed = value.trim();

    if (trimmed.length < 3) {
      throw new InvalidUsernameError(value);
    }
    if (trimmed.length > 30) {
      throw new InvalidUsernameError(value);
    }
    if (!Username.isValid(trimmed)) {
      throw new InvalidUsernameError(value);
    }

    return new Username(trimmed.toLowerCase());
  }

  private static isValid(username: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(username);
  }

  get value(): string {
    return this._value;
  }

  get displayValue(): string {
    return this._value;
  }

  equals(other: Username): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}