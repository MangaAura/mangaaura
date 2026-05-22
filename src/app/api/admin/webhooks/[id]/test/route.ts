import { NextRequest, NextResponse } from 'next/server';

import { WebhookService } from '@/core/services/WebhookService';
import { PrismaWebhookRepository } from '@/infrastructure/adapters/PrismaWebhookRepository';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const repo = new PrismaWebhookRepository();
const webhookService = new WebhookService(repo);

export async function POST(
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
    const { allowed } = await rateLimit(getRateLimitKey('admin-webhook-test', userId), 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const delivery = await webhookService.testEndpoint(id, userId);
    return NextResponse.json({ delivery });
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Webhook endpoint not found' ? 404 : message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
