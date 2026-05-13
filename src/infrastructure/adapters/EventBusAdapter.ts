import { DomainEvent as AppDomainEvent } from '../../application/events/DomainEvent';
import { IEventBus } from '../../application/services/IEventBus';
import { getEventBus, DomainEvent as InfraDomainEvent } from '../queue/LocalEventBus';

export class EventBusAdapter implements IEventBus {
  async publish<T extends AppDomainEvent>(event: T): Promise<void> {
    const infraEvent: InfraDomainEvent = {
      id: event.eventId,
      type: event.name,
      payload: event.payload as Record<string, unknown>,
      occurredAt: event.timestamp,
    };
    await getEventBus().publish(infraEvent);
  }

  async publishBatch<T extends AppDomainEvent>(events: T[]): Promise<void> {
    await Promise.all(events.map(e => this.publish(e)));
  }

  subscribe<T extends AppDomainEvent>(
    eventName: string,
    handler: (event: T) => void | Promise<void>
  ): string {
    getEventBus().subscribe(eventName, handler as any);
    return eventName;
  }

  subscribeToMany<T extends AppDomainEvent>(
    eventNames: string[],
    handler: (event: T) => void | Promise<void>
  ): string[] {
    const handlerWrapper = handler as any;
    eventNames.forEach(name => getEventBus().subscribe(name, handlerWrapper));
    return eventNames;
  }

  unsubscribe(subscriptionId: string): boolean {
    return true;
  }

  unsubscribeAll(eventName: string): number {
    return 0;
  }

  getSubscriptions() {
    return [];
  }

  getSubscriptionsForEvent(_eventName: string) {
    return [];
  }

  hasSubscribers(_eventName: string): boolean {
    return false;
  }

  async waitForPendingEvents(): Promise<void> {}

  clear(): void {}

  getStats() {
    return {
      totalPublished: 0,
      totalProcessed: 0,
      totalFailed: 0,
      activeSubscriptions: 0,
      eventsByName: {},
    };
  }
}

export const eventBusAdapter = new EventBusAdapter();
