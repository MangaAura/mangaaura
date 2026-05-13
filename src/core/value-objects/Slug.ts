import { DomainError } from '../errors/DomainError';

export class InvalidSlugError extends DomainError {
  readonly code = 'INVALID_SLUG';
  readonly isOperational = true;

  constructor(slug: string) {
    super(`El slug "${slug}" no es válido`);
  }
}

export class Slug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Slug {
    const sanitized = Slug.sanitize(value);
    if (!sanitized || sanitized.length === 0) {
      throw new InvalidSlugError(value);
    }
    if (sanitized.length > 100) {
      throw new InvalidSlugError(value);
    }
    return new Slug(sanitized);
  }

  static fromTitle(title: string): Slug {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
    return new Slug(slug);
  }

  private static sanitize(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  get value(): string {
    return this._value;
  }

  equals(other: Slug): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}