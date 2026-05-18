/**
 * POST /api/ai/batch
 * 
 * Endpoint para procesamiento batch de múltiples jobs.
 * Útil para análisis masivo de comentarios o generación
 * de embeddings para múltiples textos.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getUnifiedAIService, BatchJobRequest, ServiceJob } from '@/infrastructure/ai';
import { auth } from '@/lib/auth';

// Initialize service
let serviceInitialized = false;

async function ensureService(): Promise<void> {
  if (!serviceInitialized) {
    const service = getUnifiedAIService();
    await service.start();
    serviceInitialized = true;
  }
}

// Rate limiting with different limits for batch
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, _batchSize: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  const limit = 10; // 10 batch requests per minute
  const windowMs = 60000;
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  
  if (record.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

// Cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request
    const body = await request.json();
    const { jobs, strategy = 'parallel', failFast = false } = body;

    // Validate
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'jobs must be a non-empty array' },
        { status: 400 }
      );
    }

    if (jobs.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 jobs per batch request' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(userId, jobs.length);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) }
        }
      );
    }

    // Validate jobs
    const validTypes = [
      'analyze-comment',
      'detect-spoiler',
      'summarize-chapter',
      'generate-notification',
      'generate-embedding',
      'classify-genre',
      'classify-quality',
    ];

    for (const job of jobs) {
      if (!job.type || !validTypes.includes(job.type)) {
        return NextResponse.json(
          { error: `Invalid job type: ${job.type}` },
          { status: 400 }
        );
      }
      if (!job.payload) {
        return NextResponse.json(
          { error: 'Each job must have a payload' },
          { status: 400 }
        );
      }
    }

    // Initialize service
    await ensureService();
    const service = getUnifiedAIService();

    // Build batch request
    const batchRequest: BatchJobRequest = {
      jobs: jobs.map((job: Partial<ServiceJob>) => ({
        type: job.type!,
        payload: job.payload!,
        priority: job.priority ?? 3,
        modelId: job.modelId,
        timeout: job.timeout ?? 30000,
      })),
      strategy,
      failFast,
    };

    // Submit batch
    const startTime = Date.now();
    const results = await service.submitBatch(batchRequest);
    const totalTime = Date.now() - startTime;

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgLatency = results.reduce((sum, r) => sum + r.metadata.latencyMs, 0) / results.length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
        totalTimeMs: totalTime,
        avgLatencyMs: Math.round(avgLatency),
      },
      results: results.map((r, i) => ({
        index: i,
        jobId: r.jobId,
        success: r.success,
        data: r.data,
        error: r.error,
        latencyMs: r.metadata.latencyMs,
      })),
    });
  } catch (error) {
    console.error('[AI Batch API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
