import { NextRequest, NextResponse } from 'next/server';

import { PrismaWebhookRepository } from '@/infrastructure/adapters/PrismaWebhookRepository';
import { WebhookDeliveryService } from '@/infrastructure/adapters/WebhookDeliveryService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const repo = new PrismaWebhookRepository();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpointId, event, payload } = body;

    if (!endpointId || !event) {
      return NextResponse.json(
        { error: 'endpointId and event are required' },
        { status: 400 }
      );
    }

    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    if (endpoint.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryService = new WebhookDeliveryService(repo);
    const delivery = await deliveryService.deliver(
      endpoint as any,
      event,
      payload || { message: 'Manual delivery' }
    );

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error('Error delivering webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
