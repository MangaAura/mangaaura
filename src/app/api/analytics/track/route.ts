import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

type _Output<T> = T extends { _zod: { output: infer O } } ? O : never;

// Analytics event types (must match frontend AnalyticsEvent.type)
const EventType = z.enum([
  'page_view',
  'chapter_read',
  'chapter_complete',
  'time_spent',
  'scroll_depth',
  'comment',
  'like',
]);

// Schema for single event
const eventSchema = z.object({
  type: EventType,
  mangaId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  metadata: z.object({}).passthrough().optional(),
  timestamp: z.string().datetime().optional(),
});

// Schema for batch events
const trackRequestSchema = z.object({
  event: eventSchema.optional(),
  events: z.array(eventSchema).optional(),
});

// Process and save events
async function processEvents(
  events: _Output<typeof eventSchema>[],
  userId: string | undefined,
  _userAgent: string | null,
  _ipAddress: string | undefined,
  _referrer: string | null
): Promise<void> {
  const timestamp = new Date();

  await prisma.$transaction(async (tx: any) => {
    // Save events with only existing AnalyticsEvent fields
    await tx.analyticsEvent.createMany({
      data: events.map((event) => ({
        eventType: event.type,
        userId,
        metadata: JSON.stringify({
          ...(event.metadata || {}),
          ...(event.mangaId ? { mangaId: event.mangaId } : {}),
          ...(event.chapterId ? { chapterId: event.chapterId } : {}),
          ...(event.timestamp ? { clientTimestamp: event.timestamp } : {}),
        }),
        createdAt: event.timestamp ? new Date(event.timestamp) : timestamp,
      })),
    });

    // Update chapter view counts
    for (const event of events) {
      if (event.type === 'chapter_read' && event.chapterId) {
        await tx.chapter.update({
          where: { id: event.chapterId },
          data: { viewCount: { increment: 1 } },
        }).catch(() => {});
      }
    }
  });
}

// POST /api/analytics/track - Track analytics events
export async function POST(request: NextRequest) {
  try {
    // Check rate limit by IP (in-memory first, Redis best-effort)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('analytics', ip), 100, 60);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get user session (optional)
    const session = await auth();
    const userId = session?.user?.id;

    // Parse request body
    const body = await request.json();
    const result = trackRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Collect events
    let events: _Output<typeof eventSchema>[] = [];
    if (result.data.events && result.data.events.length > 0) {
      events = result.data.events;
    } else if (result.data.event) {
      events = [result.data.event];
    }

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (events.length > 50) {
      events = events.slice(0, 50);
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Process events
    await processEvents(events, userId, userAgent, ip, referrer);

    return NextResponse.json({
      success: true,
      tracked: events.length,
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
