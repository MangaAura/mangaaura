/**
 * POST /api/ai/generate-image
 *
 * Generates an AI image using the selected model.
 * Deducts Aura from the user before generating.
 * Persists the generated image to Vercel Blob for long-term storage.
 *
 * GET /api/ai/generate-image
 * Returns the user's generation history.
 */

import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
  calculateAuraCost,
  getProviderForModel,
  getModelById,
  type ImageGenerationRequest,
} from '@/lib/ai-image-generation';

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

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a data: URL or regular URL to a Buffer, then upload to Vercel Blob.
 * Returns both the main image URL and a thumbnail URL from Blob storage.
 */
async function persistImageToBlob(
  sourceUrl: string,
  generationId: string,
  modelId: string
): Promise<{ imageUrl: string; thumbnailUrl: string | null }> {
  let buffer: Buffer;
  let mimeType = 'image/png';

  if (sourceUrl.startsWith('data:')) {
    // Base64 data URL – decode directly
    const matches = sourceUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Regular URL – fetch it
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from provider: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = response.headers.get('content-type') || 'image/png';
  }

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const ext = extMap[mimeType] || 'png';

  // Sanitize modelId for path usage
  const safeModel = modelId.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `ai-generations/${safeModel}/${generationId}.${ext}`;
  const thumbnailFilename = `ai-generations/${safeModel}/${generationId}-thumb.${ext}`;

  // Upload full-size image
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
    cacheControlMaxAge: 31536000, // 1 year
  });

  // Upload same image as thumbnail for now (Vercel Blob doesn't do transformations)
  // In production, you could resize client-side before uploading
  const thumbBlob = await put(thumbnailFilename, buffer, {
    access: 'public',
    contentType: mimeType,
    cacheControlMaxAge: 31536000,
  });

  return {
    imageUrl: blob.url,
    thumbnailUrl: thumbBlob.url,
  };
}

// ============================================================================
// POST - Generate an image
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

    // Check user balance
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

    // Create generation record (PROCESSING)
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
        status: 'PROCESSING',
      },
    });

    try {
      // --- Deduct Aura first ---
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { auraBalance: { decrement: auraCost } },
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: -auraCost,
            type: 'IMAGE_GENERATION',
            referenceId: generation.id,
            description: `Generación de imagen con ${model.name}: "${prompt.substring(0, 80)}..."`,
          },
        }),
      ]);

      // --- Call the AI provider ---
      const provider = getProviderForModel(modelId);

      const genRequest: ImageGenerationRequest = {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt || undefined,
        modelId,
        width: width || model.maxWidth,
        height: height || model.maxHeight,
        quality: quality || 'standard',
        style: style || undefined,
        seed: seed || undefined,
      };

      const result = await provider.generateImage(genRequest);

      // --- Persist image to Vercel Blob ---
      let imageUrl = result.imageUrl;
      let thumbnailUrl: string | null = null;

      try {
        const persisted = await persistImageToBlob(result.imageUrl, generation.id, modelId);
        imageUrl = persisted.imageUrl;
        thumbnailUrl = persisted.thumbnailUrl;
      } catch (blobError) {
        // If blob storage fails, fall back to the provider's URL
        console.warn('[AI Generate Image] Blob upload failed, using provider URL:', blobError);
      }

      // --- Update generation record with the result ---
      const updated = await prisma.imageGeneration.update({
        where: { id: generation.id },
        data: {
          imageUrl,
          thumbnailUrl,
          seed: result.seed ?? null,
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: result.rawResponse
            ? JSON.stringify(result.rawResponse)
            : null,
        },
      });

      return NextResponse.json({
        success: true,
        id: updated.id,
        imageUrl: updated.imageUrl,
        thumbnailUrl: updated.thumbnailUrl,
        seed: updated.seed,
        auraCost,
        modelName: model.name,
        provider: model.provider,
        status: 'COMPLETED',
      });
    } catch (genError) {
      // Refund Aura if generation failed
      const errorMessage =
        genError instanceof Error ? genError.message : 'Error desconocido';

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { auraBalance: { increment: auraCost } },
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: auraCost,
            type: 'IMAGE_GENERATION',
            referenceId: generation.id,
            description: `Reembolso por fallo en generación: ${errorMessage.substring(0, 100)}`,
          },
        }),
        prisma.imageGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'FAILED',
            errorMessage: errorMessage.substring(0, 500),
            completedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          auraRefunded: auraCost,
          status: 'FAILED',
        },
        { status: 500 }
      );
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
