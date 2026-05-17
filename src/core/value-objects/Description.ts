export class Description {
  private constructor(private readonly value: string) {}

  static create(description: string): Description {
    if (description.length > 5000) throw new Error('Description too long');
    return new Description(description);
  }

  getValue(): string { return this.value; }
  isEmpty(): boolean { return this.value.length === 0; }
}
