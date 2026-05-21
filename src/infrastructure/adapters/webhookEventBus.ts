import { PrismaWebhookRepository } from './PrismaWebhookRepository';
import { WebhookDeliveryService } from './WebhookDeliveryService';
import { getEventBus } from '../queue/LocalEventBus';

let initialized = false;

export function initWebhookSubscriptions(): void {
  if (initialized) return;
  initialized = true;

  const repo = new PrismaWebhookRepository();
  const deliveryService = new WebhookDeliveryService(repo);
  const eventBus = getEventBus();

  const allEvents = [
    'CHAPTER_PUBLISHED',
    'MANGA_CREATED',
    'MANGA_UPDATED',
    'COMMENT_POSTED',
    'USER_REGISTERED',
    'ACHIEVEMENT_UNLOCKED',
    'NEW_CHAPTER',
    'CROWDFUNDING_GOAL_REACHED',
    'SPONSORSHIP_BID_SUBMITTED',
  ];

  for (const eventType of allEvents) {
    eventBus.subscribe(eventType, async (event) => {
      try {
        const endpoints = await repo.findActiveEndpointsByEvent(eventType);

        if (endpoints.length === 0) return;

        const deliveryPromises = endpoints.map((endpoint) =>
          deliveryService.deliver(endpoint, eventType, {
            type: event.type,
            payload: event.payload,
            occurredAt: event.occurredAt.toISOString(),
          }).catch((err) => {
            console.error(`[WebhookEventBus] Delivery failed for endpoint ${endpoint.id}:`, err);
          })
        );

        await Promise.allSettled(deliveryPromises);
      } catch (err) {
        console.error(`[WebhookEventBus] Error processing event ${eventType}:`, err);
      }
    });
  }
}
