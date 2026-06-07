/**
 * Direct (inline) image processing — fallback when BullMQ queue is unavailable.
 *
 * This replicates the original generation flow so the API works even without Redis.
 * The queue-based approach is preferred in production; this is a safety net.
 */

import { put } from '@vercel/blob';

import { getProviderForModel, type ImageGenerationRequest } from '@/lib/ai-image-generation';
import { prisma } from '@/lib/prisma';

// ============================================================================
// Helpers
// ============================================================================

async function persistImageToBlob(
  sourceUrl: string,
  generationId: string,
  modelId: string,
): Promise<{ imageUrl: string; thumbnailUrl: string | null }> {
  let buffer: Buffer;
  let mimeType = 'image/png';

  if (sourceUrl.startsWith('data:')) {
    const matches = sourceUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL format');
    mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Failed to fetch image from provider: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = response.headers.get('content-type') || 'image/png';
  }

  const extMap: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif',
  };
  const ext = extMap[mimeType] || 'png';
  const safeModel = modelId.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `ai-generations/${safeModel}/${generationId}.${ext}`;
  const thumbFilename = `ai-generations/${safeModel}/${generationId}-thumb.${ext}`;

  const blob = await put(filename, buffer, { access: 'public', contentType: mimeType, cacheControlMaxAge: 31536000 });
  const thumbBlob = await put(thumbFilename, buffer, { access: 'public', contentType: mimeType, cacheControlMaxAge: 31536000 });

  return { imageUrl: blob.url, thumbnailUrl: thumbBlob.url };
}

// ============================================================================
// Types
// ============================================================================

interface DirectProcessParams {
  prompt: string;
  negativePrompt?: string;
  modelId: string;
  width: number;
  height: number;
  quality: string;
  style?: string;
  seed?: number;
}

// ============================================================================
// Direct Processing (fallback)
// ============================================================================

export async function processGenerationDirectly(
  generation: { id: string; userId: string; prompt: string },
  _user: { auraBalance: number },
  model: { name: string; provider: string; maxWidth: number; maxHeight: number },
  auraCost: number,
  params: DirectProcessParams,
): Promise<Record<string, unknown>> {
  const { prompt, negativePrompt, modelId, width, height, quality, style, seed } = params;

  try {
    // 1. Deduct Aura
    await prisma.$transaction([
      prisma.user.update({
        where: { id: generation.userId },
        data: { auraBalance: { decrement: auraCost } },
      }),
      prisma.transaction.create({
        data: {
          userId: generation.userId,
          amount: -auraCost,
          type: 'IMAGE_GENERATION',
          referenceId: generation.id,
          description: `Generación de imagen con ${model.name}: "${prompt.substring(0, 80)}..."`,
        },
      }),
    ]);

    // 2. Call AI provider
    const provider = getProviderForModel(modelId);
    const genRequest: ImageGenerationRequest = {
      prompt,
      negativePrompt,
      modelId,
      width: width || model.maxWidth,
      height: height || model.maxHeight,
      quality: (quality as any) || 'standard',
      style: (style as any) || undefined,
      seed: seed || undefined,
    };

    const result = await provider.generateImage(genRequest);

    // 3. Persist to Vercel Blob
    let imageUrl = result.imageUrl;
    let thumbnailUrl: string | null = null;
    try {
      const persisted = await persistImageToBlob(result.imageUrl, generation.id, modelId);
      imageUrl = persisted.imageUrl;
      thumbnailUrl = persisted.thumbnailUrl;
    } catch (blobError) {
      console.warn('[DirectProcess] Blob upload failed:', blobError);
    }

    // 4. Update record
    const updated = await prisma.imageGeneration.update({
      where: { id: generation.id },
      data: {
        imageUrl,
        thumbnailUrl,
        seed: result.seed ?? null,
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: result.rawResponse ? JSON.stringify(result.rawResponse) : null,
      },
    });

    return {
      success: true,
      id: updated.id,
      imageUrl: updated.imageUrl,
      thumbnailUrl: updated.thumbnailUrl,
      seed: updated.seed,
      auraCost,
      modelName: model.name,
      provider: model.provider,
      status: 'COMPLETED',
    };
  } catch (genError) {
    const errorMessage = genError instanceof Error ? genError.message : 'Error desconocido';

    // Refund Aura
    await prisma.$transaction([
      prisma.user.update({
        where: { id: generation.userId },
        data: { auraBalance: { increment: auraCost } },
      }),
      prisma.transaction.create({
        data: {
          userId: generation.userId,
          amount: auraCost,
          type: 'IMAGE_GENERATION',
          referenceId: generation.id,
          description: `Reembolso por fallo: ${errorMessage.substring(0, 100)}`,
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

    return {
      success: false,
      error: errorMessage,
      auraRefunded: auraCost,
      status: 'FAILED',
    };
  }
}
