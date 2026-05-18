export class Tag {
  private constructor(private readonly value: string) {}

  static create(tag: string): Tag {
    const cleaned = tag.trim().toLowerCase();
    if (!cleaned) throw new Error('Tag cannot be empty');
    if (cleaned.length > 50) throw new Error('Tag too long');
    if (!/^[a-z0-9-]+$/.test(cleaned)) throw new Error('Tag can only contain letters, numbers and hyphens');
    return new Tag(cleaned);
  }

  getValue(): string { return this.value; }
  equals(other: Tag): boolean { return this.value === other.value; }
}
