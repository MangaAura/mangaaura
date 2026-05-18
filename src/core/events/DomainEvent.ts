export abstract class DomainEvent {
  abstract readonly name: string;

  abstract readonly payload: any;

  readonly timestamp: Date;

  readonly eventId: string;

  constructor() {
    this.timestamp = new Date();
    this.eventId = crypto.randomUUID();
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      name: this.name,
      payload: this.payload,
      timestamp: this.timestamp.toISOString(),
    };
  }

  toString(): string {
    return `[${this.name}] ${this.eventId} at ${this.timestamp.toISOString()}`;
  }
}

export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;

  canHandle(eventName: string): boolean;
}

export interface EventMetadata {
  eventId: string;
  name: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}
