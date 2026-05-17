/**
 * Party Messages API
 *
 * GET: Obtener mensajes del party
 * POST: Enviar mensaje al party
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { partyService } from '@/core/services/PartyService';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(500),
  type: z.enum(['chat', 'system']).default('chat'),
});

// GET /api/party/[id]/messages - Obtener mensajes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: partyId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    const messages = partyService.getMessages(partyId, limit, offset);

    return NextResponse.json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error('[Party API] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/party/[id]/messages - Enviar mensaje
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { id: partyId } = await params;
    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Verificar si el usuario esta en el party
    const member = party.members.find((m) => m.userId === session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this party' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { content, type } = result.data;

    const message = partyService.addMessage(
      partyId,
      session.user.id,
      session.user.name || 'Anonymous',
      content,
      type,
      session.user.image || undefined
    );

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('[Party API] Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
