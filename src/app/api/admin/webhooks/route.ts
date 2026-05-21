import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { WebhookService } from '@/core/services/WebhookService';
import { PrismaWebhookRepository } from '@/infrastructure/adapters/PrismaWebhookRepository';

const createSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(1).optional(),
  events: z.array(z.string()).min(1),
  description: z.string().max(255).optional(),
});

const repo = new PrismaWebhookRepository();
const webhookService = new WebhookService(repo);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const endpoints = await webhookService.list(session.user.id);
    return NextResponse.json({ endpoints });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-webhook-create', userId), 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { url, events, description } = result.data;
    const secret = result.data.secret || crypto.randomUUID();

    const endpoint = await webhookService.create(userId, url, secret, events, description);
    return NextResponse.json({ endpoint }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    const message = error?.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
