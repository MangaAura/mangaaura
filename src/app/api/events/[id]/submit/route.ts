import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const submitSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().max(5000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El evento no está activo' }, { status: 400 });
    }

    const now = new Date();
    if (now < event.startDate || now > event.endDate) {
      return NextResponse.json({ error: 'El evento no está en período de participación' }, { status: 400 });
    }

    const existing = await prisma.eventSubmission.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes una participación en este evento' }, { status: 409 });
    }

    const body = await request.json();
    const data = submitSchema.parse(body);

    const submission = await prisma.eventSubmission.create({
      data: {
        eventId: id,
        userId: session.user.id,
        imageUrl: data.imageUrl,
        prompt: data.prompt,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    await prisma.event.update({
      where: { id },
      data: { participants: { increment: 1 } },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[Event Submit] POST error:', error);
    return NextResponse.json({ error: 'Error al enviar participación' }, { status: 500 });
  }
}
