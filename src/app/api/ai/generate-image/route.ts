/**
 * POST /api/ai/generate-image
 *
 * Encola una solicitud de generación de imagen en BullMQ.
 * El worker procesa la generación en background.
 *
 * GET /api/ai/generate-image
 * Returns the user's generation history.
 *
 * GET /api/ai/generate-image/[jobId]
 * Returns the status of a queued job.
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  calculateAuraCost,
  getModelById,
} from '@/lib/ai-image-generation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


// ============================================================================
// Rate Limiting (simple in-memory, use Redis in production)
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 generations per minute

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// POST - Enqueue an image generation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Espera un momento antes de generar otra imagen.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const {
      prompt,
      negativePrompt,
      modelId,
      width,
      height,
      quality,
      style,
      seed,
    } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt es requerido' },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt demasiado largo (máximo 4000 caracteres)' },
        { status: 400 }
      );
    }

    // Validate model
    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: `Modelo inválido: ${modelId}` },
        { status: 400 }
      );
    }

    // Calculate cost
    const auraCost = calculateAuraCost(modelId);

    // Check user balance (without deducting — the worker does it)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auraBalance: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.auraBalance < auraCost) {
      return NextResponse.json(
        {
          error: 'Aura insuficiente',
          required: auraCost,
          balance: user.auraBalance,
        },
        { status: 402 }
      );
    }

    // Create generation record (QUEUED status)
    const generation = await prisma.imageGeneration.create({
      data: {
        userId,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt || null,
        modelId,
        provider: model.provider,
        width: width || model.maxWidth,
        height: height || model.maxHeight,
        quality: quality || 'standard',
        style: style || null,
        seed: seed || null,
        auraCost,
        status: 'PENDING',
      },
    });

    // Enqueue the job (fire-and-forget)
    try {
      const { getImageGenerationQueue } = await import('@/infrastructure/queue/ImageGenerationQueue');
      const queue = getImageGenerationQueue();
      const job = await queue.addGenerationJob({
        generationId: generation.id,
        userId,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt || null,
        modelId,
        width: width || model.maxWidth,
        height: height || model.maxHeight,
        quality: quality || 'standard',
        style: style || null,
        seed: seed || null,
        auraCost,
        modelName: model.name,
      });

      return NextResponse.json({
        success: true,
        id: generation.id,
        jobId: job.id,
        auraCost,
        modelName: model.name,
        provider: model.provider,
        status: 'PENDING',
        message: 'Generación encolada. Recibirás la imagen cuando esté lista.',
      });
    } catch (queueError) {
      // If queue fails, fall through to direct processing
      console.warn('[AI Generate Image] Queue unavailable, processing directly:', queueError);

      // Fallback: process directly (same as before)
      // Import dynamically to avoid circular deps
      const { processGenerationDirectly } = await import('./direct-process');
      const result = await processGenerationDirectly(generation, user, model, auraCost, {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt || undefined,
        modelId,
        width: width || model.maxWidth,
        height: height || model.maxHeight,
        quality: quality || 'standard',
        style: style || undefined,
        seed: seed || undefined,
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[AI Generate Image API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - List user's generation history
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const cursor = searchParams.get('cursor');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { userId };
    if (status && ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      where.status = status;
    }

    const generations = await prisma.imageGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        prompt: true,
        modelId: true,
        provider: true,
        width: true,
        height: true,
        quality: true,
        style: true,
        imageUrl: true,
        thumbnailUrl: true,
        auraCost: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const hasMore = generations.length > limit;
    const items = hasMore ? generations.slice(0, limit) : generations;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('[AI Generate Image History API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
