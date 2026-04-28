import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendMessage, getMessages } from '@/core/services/MessageService';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

// GET /api/conversations/[id]/messages - Get messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await getMessages({
      conversationId,
      userId: session.user.id,
      page,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('no encontrada') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      messages: result.messages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil((result.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = result.data;

    const messageResult = await sendMessage({
      conversationId,
      senderId: session.user.id,
      content,
    });

    if (!messageResult.success) {
      return NextResponse.json(
        { error: messageResult.error },
        { status: messageResult.error?.includes('no encontrada') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: messageResult.message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
