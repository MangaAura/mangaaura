import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getConversations,
  getOrCreateConversation,
} from '@/core/services/MessageService';
import { z } from 'zod';

const createConversationSchema = z.object({
  participantId: z.string().uuid(),
});

// GET /api/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getConversations({
      userId: session.user.id,
      page,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversations: result.conversations,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil((result.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createConversationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { participantId } = result.data;

    // Can't message yourself
    if (participantId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes iniciar una conversación contigo mismo' },
        { status: 400 }
      );
    }

    const conversation = await getOrCreateConversation({
      participant1Id: session.user.id,
      participant2Id: participantId,
    });

    if (!conversation.success) {
      return NextResponse.json(
        { error: conversation.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: conversation.conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
