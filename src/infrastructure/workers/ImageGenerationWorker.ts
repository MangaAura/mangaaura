/**
 * Worker de Generación de Imágenes con IA
 *
 * Procesa jobs de la cola de generación de imágenes usando BullMQ.
 * Llama al proveedor AI, persiste la imagen en Vercel Blob y actualiza
 * el registro en la base de datos.
 *
 * @packageDocumentation
 */

import { put } from '@vercel/blob';
import { Worker, Job } from 'bullmq';

import { getBullConnection } from '@/infrastructure/queue/connection';
import type { ImageGenerationJobData, ImageGenerationJobResult } from '@/infrastructure/queue/ImageGenerationQueue';
import { getProviderForModel, getModelById, type ImageGenerationRequest } from '@/lib/ai-image-generation';
import { getRedisCircuitBreaker } from '@/lib/circuit-breaker';
import { prisma } from '@/lib/prisma';
import { isMockRedis } from '@/lib/redis';
import { captureException } from '@/lib/sentry';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a data: URL or regular URL to a Buffer, then upload to Vercel Blob.
 */
async function persistImageToBlob(
  sourceUrl: string,
  generationId: string,
  modelId: string,
): Promise<{ imageUrl: string; thumbnailUrl: string | null }> {
  let buffer: Buffer;
  let mimeType = 'image/png';

  if (sourceUrl.startsWith('data:')) {
    const matches = sourceUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    mimeType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from provider: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    mimeType = response.headers.get('content-type') || 'image/png';
  }

  const extMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  const ext = extMap[mimeType] || 'png';
  const safeModel = modelId.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `ai-generations/${safeModel}/${generationId}.${ext}`;
  const thumbnailFilename = `ai-generations/${safeModel}/${generationId}-thumb.${ext}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: mimeType,
    cacheControlMaxAge: 31536000,
  });

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
// Mock Worker (for development without Redis)
// ============================================================================

class MockImageGenerationWorker {
  async close(): Promise<void> {
    // No-op
  }
}

// ============================================================================
// Image Generation Worker
// ============================================================================

export class ImageGenerationWorker {
  private worker: Worker | MockImageGenerationWorker | null = null;
  private useMock: boolean;

  constructor() {
    this.useMock = isMockRedis();

    if (this.useMock) {
      this.initializeMockWorker();
    } else {
      this.initializeRealWorker();
    }
  }

  private initializeMockWorker(): void {
    this.worker = new MockImageGenerationWorker();
    if (process.env.NODE_ENV === 'development') {
      console.log('[ImageGenerationWorker] Running in mock mode (Redis not available)');
    }
  }

  private initializeRealWorker(): void {
    if (isMockRedis()) {
      this.useMock = true;
      this.initializeMockWorker();
      return;
    }

    try {
      this.worker = new Worker(
        'image-generation',
        async (job: Job<ImageGenerationJobData>) => {
          await this.processJob(job);
        },
        {
          connection: getBullConnection(),
          concurrency: 2,
          limiter: {
            max: 3,
            duration: 60_000,
          },
          stalledInterval: 30000,
          maxStalledCount: 2,
        },
      );

      this.setupEventHandlers();
    } catch (error) {
      console.error('[ImageGenerationWorker] Failed to initialize worker:', error);
      this.useMock = true;
      this.initializeMockWorker();
    }
  }

  private setupEventHandlers(): void {
    if (!this.worker || this.useMock) return;

    const bullWorker = this.worker as Worker;

    bullWorker.on('completed', (job: Job) => {
      console.info(`[ImageGenerationWorker] Job ${job.id} completed`);
    });

    bullWorker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[ImageGenerationWorker] Job ${job?.id} failed:`, err.message);
      captureException(err, {
        extra: { jobId: job?.id, queue: 'image-generation' },
      });
    });

    bullWorker.on('error', (error: Error) => {
      console.error('[ImageGenerationWorker] Worker error:', error.message);
      captureException(error, { extra: { queue: 'image-generation' } });
    });

    bullWorker.on('stalled', (jobId: string) => {
      console.warn(`[ImageGenerationWorker] Job ${jobId} stalled`);
      captureException(new Error('ImageGenerationWorker job stalled'), {
        extra: { jobId, queue: 'image-generation' },
      });
    });
  }

  private async processJob(job: Job<ImageGenerationJobData>): Promise<ImageGenerationJobResult> {
    const { data } = job;
    console.info(`[ImageGenerationWorker] Processing job ${job.id}: ${data.generationId}`);

    // Circuit breaker check
    const breaker = getRedisCircuitBreaker();
    if (breaker.getState() !== 'CLOSED') {
      throw new Error('Redis circuit breaker open — cannot process generation job');
    }

    const model = getModelById(data.modelId);
    if (!model) {
      throw new Error(`Unknown model: ${data.modelId}`);
    }

    try {
      // 1. Deduct Aura
      await prisma.$transaction([
        prisma.user.update({
          where: { id: data.userId },
          data: { auraBalance: { decrement: data.auraCost } },
        }),
        prisma.transaction.create({
          data: {
            userId: data.userId,
            amount: -data.auraCost,
            type: 'IMAGE_GENERATION',
            referenceId: data.generationId,
            description: `Generación de imagen con ${data.modelName}: "${data.prompt.substring(0, 80)}..."`,
          },
        }),
      ]);

      // 2. Call the AI provider
      const provider = getProviderForModel(data.modelId);

      const genRequest: ImageGenerationRequest = {
        prompt: data.prompt,
        negativePrompt: data.negativePrompt || undefined,
        modelId: data.modelId,
        width: data.width || model.maxWidth,
        height: data.height || model.maxHeight,
        quality: (data.quality as any) || 'standard',
        style: (data.style as any) || undefined,
        seed: data.seed || undefined,
      };

      const result = await provider.generateImage(genRequest);

      // 3. Persist to Vercel Blob
      let imageUrl = result.imageUrl;
      let thumbnailUrl: string | null = null;

      try {
        const persisted = await persistImageToBlob(result.imageUrl, data.generationId, data.modelId);
        imageUrl = persisted.imageUrl;
        thumbnailUrl = persisted.thumbnailUrl;
      } catch (blobError) {
        console.warn('[ImageGenerationWorker] Blob upload failed, using provider URL:', blobError);
      }

      // 4. Update generation record
      await prisma.imageGeneration.update({
        where: { id: data.generationId },
        data: {
          imageUrl,
          thumbnailUrl,
          seed: result.seed ?? null,
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: result.rawResponse ? JSON.stringify(result.rawResponse) : null,
        },
      });

      breaker.recordSuccess();

      return {
        imageUrl,
        thumbnailUrl,
        seed: result.seed ?? null,
        auraCost: data.auraCost,
        modelName: data.modelName,
        provider: model.provider,
        status: 'COMPLETED',
      };
    } catch (error) {
      // Refund Aura on failure
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      try {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: data.userId },
            data: { auraBalance: { increment: data.auraCost } },
          }),
          prisma.transaction.create({
            data: {
              userId: data.userId,
              amount: data.auraCost,
              type: 'IMAGE_GENERATION',
              referenceId: data.generationId,
              description: `Reembolso por fallo en generación: ${errorMessage.substring(0, 100)}`,
            },
          }),
          prisma.imageGeneration.update({
            where: { id: data.generationId },
            data: {
              status: 'FAILED',
              errorMessage: errorMessage.substring(0, 500),
              completedAt: new Date(),
            },
          }),
        ]);
      } catch (dbError) {
        console.error('[ImageGenerationWorker] Failed to refund Aura:', dbError);
      }

      if (error instanceof Error && error.name !== 'TimeoutError') {
        breaker.recordFailure(error);
      }

      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker?.close();
  }
}

// ============================================================================
// Singleton Factory
// ============================================================================

let globalWorker: ImageGenerationWorker | null = null;

export function getImageGenerationWorker(): ImageGenerationWorker {
  if (!globalWorker) {
    globalWorker = new ImageGenerationWorker();
  }
  return globalWorker;
}

export function stopImageGenerationWorker(): void {
  globalWorker?.close();
  globalWorker = null;
}

export default ImageGenerationWorker;
