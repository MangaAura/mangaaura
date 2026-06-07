/**
 * GET /api/ai/generate-image/[id]/status
 *
 * Returns the current status of an image generation.
 * Used by the frontend to poll when the job is queued (PENDING status).
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const generation = await prisma.imageGeneration.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        status: true,
        imageUrl: true,
        thumbnailUrl: true,
        seed: true,
        auraCost: true,
        errorMessage: true,
        modelId: true,
        provider: true,
        prompt: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!generation) {
      return NextResponse.json({ error: 'Generación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      imageUrl: generation.imageUrl,
      thumbnailUrl: generation.thumbnailUrl,
      seed: generation.seed,
      auraCost: generation.auraCost,
      errorMessage: generation.errorMessage,
      prompt: generation.prompt,
      createdAt: generation.createdAt.toISOString(),
      completedAt: generation.completedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Generation Status API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
