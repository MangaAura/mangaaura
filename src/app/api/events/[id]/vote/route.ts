import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const voteSchema = z.object({
  submissionId: z.string().uuid(),
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

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    if (event.status !== 'VOTING' && event.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Este evento no está en fase de votación' }, { status: 400 });
    }

    const body = await request.json();
    const data = voteSchema.parse(body);

    const submission = await prisma.eventSubmission.findUnique({
      where: { id: data.submissionId },
    });

    if (!submission || submission.eventId !== id) {
      return NextResponse.json({ error: 'Participación no encontrada en este evento' }, { status: 404 });
    }

    if (submission.userId === session.user.id) {
      return NextResponse.json({ error: 'No puedes votar por tu propia participación' }, { status: 400 });
    }

    const existingVote = await prisma.eventVote.findUnique({
      where: {
        submissionId_userId: {
          submissionId: data.submissionId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      await prisma.eventVote.delete({ where: { id: existingVote.id } });
      await prisma.eventSubmission.update({
        where: { id: data.submissionId },
        data: { votes: { decrement: 1 } },
      });

      return NextResponse.json({ voted: false, votes: submission.votes - 1 });
    }

    const userExistingVote = await prisma.eventVote.findFirst({
      where: {
        userId: session.user.id,
        submission: { eventId: id },
      },
    });

    if (userExistingVote) {
      await prisma.eventVote.delete({ where: { id: userExistingVote.id } });
      await prisma.eventSubmission.update({
        where: { id: userExistingVote.submissionId },
        data: { votes: { decrement: 1 } },
      });
    }

    await prisma.eventVote.create({
      data: {
        submissionId: data.submissionId,
        userId: session.user.id,
      },
    });
    await prisma.eventSubmission.update({
      where: { id: data.submissionId },
      data: { votes: { increment: 1 } },
    });

    const updated = await prisma.eventSubmission.findUnique({
      where: { id: data.submissionId },
      select: { votes: true },
    });

    return NextResponse.json({ voted: true, votes: updated?.votes ?? 0, submissionId: data.submissionId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[Event Vote] POST error:', error);
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 });
  }
}
