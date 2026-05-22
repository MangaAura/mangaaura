export const AVAILABLE_EVENTS = [
  'CHAPTER_PUBLISHED',
  'MANGA_CREATED',
  'MANGA_UPDATED',
  'COMMENT_POSTED',
  'USER_REGISTERED',
  'ACHIEVEMENT_UNLOCKED',
  'NEW_CHAPTER',
  'CROWDFUNDING_GOAL_REACHED',
  'SPONSORSHIP_BID_SUBMITTED',
] as const;

export type WebhookEvent = (typeof AVAILABLE_EVENTS)[number];

export interface WebhookEndpointDTO {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  recentDeliveries?: WebhookDeliveryDTO[];
}

export interface WebhookDeliveryDTO {
  id: string;
  endpointId: string;
  event: string;
  payload: string;
  status: string;
  statusCode: number | null;
  responseBody: string | null;
  durationMs: number | null;
  attemptCount: number;
  error: string | null;
  createdAt: string;
}

import type {
  IWebhookRepository,
  WebhookEndpointRecord,
  WebhookDeliveryRecord,
} from './IWebhookRepository';

function toEndpointDTO(record: WebhookEndpointRecord, deliveries?: WebhookDeliveryRecord[]): WebhookEndpointDTO {
  return {
    id: record.id,
    userId: record.userId,
    url: record.url,
    secret: record.secret,
    events: JSON.parse(record.events) as string[],
    isActive: record.isActive,
    description: record.description,
    lastTriggeredAt: record.lastTriggeredAt?.toISOString() ?? null,
    failureCount: record.failureCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    recentDeliveries: deliveries?.map(toDeliveryDTO),
  };
}

function toDeliveryDTO(record: WebhookDeliveryRecord): WebhookDeliveryDTO {
  return {
    id: record.id,
    endpointId: record.endpointId,
    event: record.event,
    payload: record.payload,
    status: record.status,
    statusCode: record.statusCode,
    responseBody: record.responseBody,
    durationMs: record.durationMs,
    attemptCount: record.attemptCount,
    error: record.error,
    createdAt: record.createdAt.toISOString(),
  };
}

export class WebhookService {
  constructor(private readonly repo: IWebhookRepository) {}

  async create(
    userId: string,
    url: string,
    secret: string,
    events: string[],
    description?: string
  ): Promise<WebhookEndpointDTO> {
    const invalidEvents = events.filter(e => !(AVAILABLE_EVENTS as readonly string[]).includes(e));
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
    }

    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    const record = await this.repo.createEndpoint({
      userId,
      url,
      secret,
      events: JSON.stringify(events),
      description: description ?? null,
    });

    return toEndpointDTO(record);
  }

  async update(
    id: string,
    userId: string,
    data: { url?: string; secret?: string; events?: string[]; isActive?: boolean; description?: string }
  ): Promise<WebhookEndpointDTO> {
    const existing = await this.repo.findEndpointById(id);
    if (!existing) {
      throw new Error('Webhook endpoint not found');
    }
    if (existing.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        throw new Error('Invalid URL format');
      }
    }

    if (data.events) {
      const invalidEvents = data.events.filter(e => !(AVAILABLE_EVENTS as readonly string[]).includes(e));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.url !== undefined) updateData.url = data.url;
    if (data.secret !== undefined) updateData.secret = data.secret;
    if (data.events !== undefined) updateData.events = JSON.stringify(data.events);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined) updateData.description = data.description;

    const record = await this.repo.updateEndpoint(id, updateData as any);
    return toEndpointDTO(record);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findEndpointById(id);
    if (!existing) {
      throw new Error('Webhook endpoint not found');
    }
    if (existing.userId !== userId) {
      throw new Error('Unauthorized');
    }
    await this.repo.deleteEndpoint(id);
  }

  async list(userId: string): Promise<WebhookEndpointDTO[]> {
    const records = await this.repo.findEndpointsByUserId(userId);
    return Promise.all(
      records.map(async (r) => {
        const deliveries = await this.repo.findDeliveriesByEndpointId(r.id, 1, 5);
        return toEndpointDTO(r, deliveries.items);
      })
    );
  }

  async getDeliveries(
    endpointId: string,
    userId: string,
    page: number = 1
  ): Promise<{ deliveries: WebhookDeliveryDTO[]; total: number; totalPages: number }> {
    const existing = await this.repo.findEndpointById(endpointId);
    if (!existing) {
      throw new Error('Webhook endpoint not found');
    }
    if (existing.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const result = await this.repo.findDeliveriesByEndpointId(endpointId, page, 20);
    return {
      deliveries: result.items.map(toDeliveryDTO),
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  async redeliver(deliveryId: string, userId: string): Promise<void> {
    const delivery = await this.repo.findDeliveryById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const endpoint = await this.repo.findEndpointById(delivery.endpointId);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }
    if (endpoint.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const { WebhookDeliveryService } = await import('@/infrastructure/adapters/WebhookDeliveryService');
    const deliveryService = new WebhookDeliveryService(this.repo);
    await deliveryService.deliver(endpoint, delivery.event, JSON.parse(delivery.payload));
  }

  async getAvailableEvents(): Promise<string[]> {
    return [...AVAILABLE_EVENTS];
  }

  async testEndpoint(endpointId: string, userId: string): Promise<WebhookDeliveryDTO> {
    const endpoint = await this.repo.findEndpointById(endpointId);
    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }
    if (endpoint.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const { WebhookDeliveryService } = await import('@/infrastructure/adapters/WebhookDeliveryService');
    const deliveryService = new WebhookDeliveryService(this.repo);
    const testPayload = { message: 'This is a test webhook from MangaAura' };
    const delivery = await deliveryService.deliver(endpoint, 'TEST', testPayload);
    return toDeliveryDTO(delivery);
  }
}
