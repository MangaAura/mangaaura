/**
 * POST /api/ai/submit
 * 
 * Endpoint para enviar jobs al servicio de IA unificado.
 * Soporta análisis de comentarios, detección de spoilers, 
 * resúmenes de capítulos, embeddings y clasificación.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getUnifiedAIService, ServiceJob } from '@/infrastructure/ai';
import { auth } from '@/lib/auth';

// Initialize service on first request
let serviceInitialized = false;

async function ensureService(): Promise<void> {
  if (!serviceInitialized) {
    const service = getUnifiedAIService();
    await service.start();
    serviceInitialized = true;
  }
}

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
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

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { type, payload, priority, modelId, timeout } = body;

    // Validate required fields
    if (!type || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: type, payload' },
        { status: 400 }
      );
    }

    // Validate job type
    const validTypes = [
      'analyze-comment',
      'detect-spoiler',
      'summarize-chapter',
      'generate-notification',
      'generate-embedding',
      'classify-genre',
      'classify-quality',
      'batch-inference',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize service
    await ensureService();
    const service = getUnifiedAIService();

    // Build job
    const job: ServiceJob = {
      type,
      payload,
      priority: priority ?? 3,
      modelId,
      timeout: timeout ?? 30000,
    };

    // Submit to service
    const result = await service.submit(job);

    // Return appropriate response
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        metadata: result.metadata,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          metadata: result.metadata,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[AI Submit API] Error:', error);
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

// Also support GET for health check
export async function GET() {
  try {
    await ensureService();
    const service = getUnifiedAIService();
    const health = service.getHealth();
    
    return NextResponse.json({
      status: health.status,
      components: health.components,
      models: health.models,
      performance: health.performance,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Service unavailable',
      },
      { status: 503 }
    );
  }
}
