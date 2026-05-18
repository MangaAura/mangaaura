export class MangaTitle {
  private constructor(private readonly value: string) {}

  static create(title: string): MangaTitle {
    if (!title || title.trim().length === 0) throw new Error('Title cannot be empty');
    if (title.length > 200) throw new Error('Title too long');
    return new MangaTitle(title.trim());
  }

  getValue(): string { return this.value; }

  equals(other: MangaTitle): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
