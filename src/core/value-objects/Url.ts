export class Url {
  private constructor(private readonly value: string) {}

  static create(url: string): Url {
    try { new URL(url); } catch { throw new Error('Invalid URL'); }
    return new Url(url);
  }

  getValue(): string { return this.value; }
  equals(other: Url): boolean { return this.value === other.value; }
}
