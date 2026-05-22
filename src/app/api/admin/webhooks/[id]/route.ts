import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { WebhookService } from '@/core/services/WebhookService';
import { PrismaWebhookRepository } from '@/infrastructure/adapters/PrismaWebhookRepository';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const updateSchema = z.object({
  url: z.string().url().optional(),
  secret: z.string().min(1).optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(255).nullable().optional(),
});

const repo = new PrismaWebhookRepository();
const webhookService = new WebhookService(repo);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    if (endpoint.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      endpoint: {
        ...endpoint,
        events: JSON.parse(endpoint.events),
        lastTriggeredAt: endpoint.lastTriggeredAt?.toISOString() ?? null,
        createdAt: endpoint.createdAt.toISOString(),
        updatedAt: endpoint.updatedAt.toISOString(),
        deliveries: endpoint.deliveries.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-webhook-update', userId), 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = { ...result.data, description: result.data.description ?? undefined };
    const endpoint = await webhookService.update(id, userId, updateData);
    return NextResponse.json({ endpoint });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Webhook endpoint not found' ? 404 : message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-webhook-delete', userId), 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await webhookService.delete(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Webhook endpoint not found' ? 404 : message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
