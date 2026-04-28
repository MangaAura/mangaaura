import { EventEmitter } from 'events';

// Domain Events
export interface DomainEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  aggregateId?: string;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  eventType: string;
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

// Implementación local con EventEmitter
export class LocalEventBus implements EventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, Set<(event: DomainEvent) => Promise<void>>>;

  constructor() {
    this.emitter = new EventEmitter();
    this.handlers = new Map();
    this.emitter.setMaxListeners(100);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      console.log(`[EventBus] No handlers for event: ${event.type}`);
      return;
    }

    console.log(`[EventBus] Publishing ${event.type} to ${handlers.size} handlers`);

    // Ejecutar handlers en paralelo
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler failed for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as (event: DomainEvent) => Promise<void>);
    console.log(`[EventBus] Subscribed handler to ${eventType}`);
  }

  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  // Helper para crear eventos
  static createEvent(
    type: string,
    payload: Record<string, unknown>,
    aggregateId?: string
  ): DomainEvent {
    return {
      id: crypto.randomUUID(),
      type,
      payload,
      occurredAt: new Date(),
      aggregateId,
    };
  }
}

// Singleton para uso global
let globalEventBus: LocalEventBus | null = null;

export function getEventBus(): LocalEventBus {
  if (!globalEventBus) {
    globalEventBus = new LocalEventBus();
  }
  return globalEventBus;
}

export function resetEventBus(): void {
  globalEventBus = null;
}
