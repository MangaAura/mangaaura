import { DomainError } from '../errors/DomainError';

export class WeakPasswordError extends DomainError {
  readonly code = 'WEAK_PASSWORD';
  readonly isOperational = true;

  constructor(reason: string) {
    super(`Contraseña débil: ${reason}`);
  }
}

export class Password {
  private readonly _hash?: string;
  private readonly _plainText?: string;

  private constructor(hash?: string, plainText?: string) {
    this._hash = hash;
    this._plainText = plainText;
  }

  static createFromPlain(plainText: string): Password {
    Password.validate(plainText);
    return new Password(undefined, plainText);
  }

  static createFromHash(hash: string): Password {
    return new Password(hash, undefined);
  }

  private static validate(plainText: string): void {
    if (plainText.length < 8) {
      throw new WeakPasswordError('Mínimo 8 caracteres');
    }
    if (plainText.length > 128) {
      throw new WeakPasswordError('Máximo 128 caracteres');
    }
    if (!/[A-Z]/.test(plainText)) {
      throw new WeakPasswordError('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(plainText)) {
      throw new WeakPasswordError('Debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(plainText)) {
      throw new WeakPasswordError('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(plainText)) {
      throw new WeakPasswordError('Debe contener al menos un carácter especial');
    }
  }

  get isHashed(): boolean {
    return !!this._hash;
  }

  get plainText(): string | undefined {
    return this._plainText;
  }

  get hash(): string | undefined {
    return this._hash;
  }

  toString(): string {
    return this._hash ?? '[PLAIN_TEXT_HIDDEN]';
  }
}
