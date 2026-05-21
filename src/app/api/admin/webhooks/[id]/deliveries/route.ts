import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { WebhookService } from '@/core/services/WebhookService';
import { PrismaWebhookRepository } from '@/infrastructure/adapters/PrismaWebhookRepository';

const repo = new PrismaWebhookRepository();
const webhookService = new WebhookService(repo);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');

    const result = await webhookService.getDeliveries(id, session.user.id, page);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing endpoint deliveries:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Webhook endpoint not found' ? 404 : message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
