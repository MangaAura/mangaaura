import type {
  IWebhookRepository,
  WebhookEndpointRecord,
  WebhookDeliveryRecord,
  CreateWebhookEndpointData,
  UpdateWebhookEndpointData,
  CreateWebhookDeliveryData,
  PaginatedResult,
} from '@/core/services/IWebhookRepository';
import { prisma } from '@/lib/prisma';

export class PrismaWebhookRepository implements IWebhookRepository {
  async createEndpoint(data: CreateWebhookEndpointData): Promise<WebhookEndpointRecord> {
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        userId: data.userId,
        url: data.url,
        secret: data.secret,
        events: data.events,
        description: data.description ?? null,
      },
    });
    return endpoint as unknown as WebhookEndpointRecord;
  }

  async updateEndpoint(id: string, data: UpdateWebhookEndpointData): Promise<WebhookEndpointRecord> {
    const endpoint = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.secret !== undefined && { secret: data.secret }),
        ...(data.events !== undefined && { events: data.events }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    return endpoint as unknown as WebhookEndpointRecord;
  }

  async deleteEndpoint(id: string): Promise<void> {
    await prisma.webhookEndpoint.delete({ where: { id } });
  }

  async findEndpointById(id: string): Promise<WebhookEndpointRecord | null> {
    const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
    return endpoint as unknown as WebhookEndpointRecord | null;
  }

  async findEndpointsByUserId(userId: string): Promise<WebhookEndpointRecord[]> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return endpoints as unknown as WebhookEndpointRecord[];
  }

  async findActiveEndpointsByEvent(event: string): Promise<WebhookEndpointRecord[]> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        isActive: true,
      },
    });
    return endpoints.filter((ep) => {
      try {
        const events = JSON.parse(ep.events) as string[];
        return events.includes(event);
      } catch {
        return false;
      }
    }) as unknown as WebhookEndpointRecord[];
  }

  async updateEndpointTrigger(id: string): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      },
    });
  }

  async incrementFailureCount(id: string): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        failureCount: { increment: 1 },
      },
    });
  }

  async resetFailureCount(id: string): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id },
      data: { failureCount: 0 },
    });
  }

  async createDelivery(data: CreateWebhookDeliveryData): Promise<WebhookDeliveryRecord> {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: data.endpointId,
        event: data.event,
        payload: data.payload,
        status: data.status,
        statusCode: data.statusCode ?? null,
        responseBody: data.responseBody ?? null,
        durationMs: data.durationMs ?? null,
        attemptCount: data.attemptCount ?? 1,
        error: data.error ?? null,
      },
    });
    return delivery as unknown as WebhookDeliveryRecord;
  }

  async findDeliveryById(id: string): Promise<WebhookDeliveryRecord | null> {
    const delivery = await prisma.webhookDelivery.findUnique({ where: { id } });
    return delivery as unknown as WebhookDeliveryRecord | null;
  }

  async findDeliveriesByEndpointId(
    endpointId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<WebhookDeliveryRecord>> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { endpointId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where: { endpointId } }),
    ]);

    return {
      items: items as unknown as WebhookDeliveryRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDeliveries(
    page: number = 1,
    limit: number = 20,
    endpointId?: string,
    status?: string
  ): Promise<PaginatedResult<WebhookDeliveryRecord>> {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (endpointId) where.endpointId = endpointId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    return {
      items: items as unknown as WebhookDeliveryRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateDelivery(id: string, data: Partial<CreateWebhookDeliveryData>): Promise<WebhookDeliveryRecord> {
    const delivery = await prisma.webhookDelivery.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.statusCode !== undefined && { statusCode: data.statusCode }),
        ...(data.responseBody !== undefined && { responseBody: data.responseBody }),
        ...(data.durationMs !== undefined && { durationMs: data.durationMs }),
        ...(data.attemptCount !== undefined && { attemptCount: data.attemptCount }),
        ...(data.error !== undefined && { error: data.error }),
      },
    });
    return delivery as unknown as WebhookDeliveryRecord;
  }
}
