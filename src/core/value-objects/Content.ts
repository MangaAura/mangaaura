export class Content {
  private constructor(private readonly value: string) {}

  static create(content: string): Content {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Content cannot be empty');
    if (trimmed.length > 10000) throw new Error('Content too long');
    return new Content(trimmed);
  }

  getValue(): string { return this.value; }
  equals(other: Content): boolean { return this.value === other.value; }
}
