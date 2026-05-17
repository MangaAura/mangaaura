import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { z } from 'zod';

type _Output<T> = T extends { _zod: { output: infer O } } ? O : never;

// Analytics event types
const EventType = z.enum([
  'pageView',
  'chapterRead',
  'timeSpent',
  'scrollDepth',
  'chapterComplete',
  'mangaView',
  'searchQuery',
  'bookmarkAdd',
  'ratingGiven',
  'shareEvent',
  'commentPost',
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

// Rate limiting: max 100 events per minute per user/IP
async function checkRateLimit(key: string): Promise<boolean> {
  const rateLimitKey = `rate_limit:analytics:${key}`;
  const current = await redis.incr(rateLimitKey);

  if (current === 1) {
    await redis.expire(rateLimitKey, 60); // 1 minute window
  }

  return current <= 100;
}

// Generate session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Anonymize IP address
function anonymizeIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  
  // IPv4: remove last octet
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  
  // IPv6: keep first 4 segments
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  
  return ip;
}

// Process and save events
async function processEvents(
  events: _Output<typeof eventSchema>[],
  userId: string | undefined,
  userAgent: string | null,
  ipAddress: string | undefined,
  referrer: string | null
): Promise<void> {
  const sessionId = generateSessionId();
  const timestamp = new Date();

  await prisma.$transaction(async (tx: any) => {
    // Save events
    await tx.analyticsEvent.createMany({
      data: events.map((event) => ({
        eventType: event.type,
        mangaId: event.mangaId,
        chapterId: event.chapterId,
        userId,
        sessionId,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        timestamp: event.timestamp ? new Date(event.timestamp) : timestamp,
        userAgent,
        ipAddress: anonymizeIp(ipAddress),
        referrer,
      })),
    });

    // Update real-time counters and stats
    for (const event of events) {
      if (event.mangaId) {
        await updateMangaStats(tx, event, timestamp);
      }
      if (event.chapterId) {
        await updateChapterStats(tx, event, timestamp);
      }
    }
  });
}

// Update manga daily stats
async function updateMangaStats(
  tx: any,
  event: _Output<typeof eventSchema>,
  timestamp: Date
): Promise<void> {
  if (!event.mangaId) return;

  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  const hour = timestamp.getHours();

  // Update daily stats
  await tx.dailyStats.upsert({
    where: {
      date_mangaId: {
        date,
        mangaId: event.mangaId,
      },
    },
    create: {
      date,
      mangaId: event.mangaId,
      views: event.type === 'pageView' || event.type === 'mangaView' ? 1 : 0,
      reads: event.type === 'chapterRead' ? 1 : 0,
      completions: event.type === 'chapterComplete' ? 1 : 0,
    },
    update: {
      views: event.type === 'pageView' || event.type === 'mangaView' ? { increment: 1 } : undefined,
      reads: event.type === 'chapterRead' ? { increment: 1 } : undefined,
      completions: event.type === 'chapterComplete' ? { increment: 1 } : undefined,
    },
  });

  // Update hourly stats
  await tx.hourlyStats.upsert({
    where: {
      date_hour_mangaId: {
        date,
        hour,
        mangaId: event.mangaId,
      },
    },
    create: {
      date,
      hour,
      mangaId: event.mangaId,
      views: event.type === 'pageView' || event.type === 'mangaView' ? 1 : 0,
      reads: event.type === 'chapterRead' ? 1 : 0,
    },
    update: {
      views: event.type === 'pageView' || event.type === 'mangaView' ? { increment: 1 } : undefined,
      reads: event.type === 'chapterRead' ? { increment: 1 } : undefined,
    },
  });
}

// Update chapter stats
async function updateChapterStats(
  tx: any,
  event: _Output<typeof eventSchema>,
  _timestamp: Date
): Promise<void> {
  if (!event.chapterId || !event.mangaId) return;

  // Get current chapter stats
  const existingStats = await tx.chapterStats.findUnique({
    where: { chapterId: event.chapterId },
  });

  if (!existingStats) {
    // Create new stats
    await tx.chapterStats.create({
      data: {
        chapterId: event.chapterId,
        mangaId: event.mangaId,
        views: event.type === 'pageView' || event.type === 'chapterRead' ? 1 : 0,
        reads: event.type === 'chapterRead' ? 1 : 0,
        completions: event.type === 'chapterComplete' ? 1 : 0,
        avgTimeSpent: event.metadata?.seconds || 0,
      },
    });
  } else {
    // Update existing stats
    const updates: any = {};

    if (event.type === 'pageView' || event.type === 'chapterRead') {
      updates.views = { increment: 1 };
      updates.reads = { increment: 1 };
    }
    if (event.type === 'chapterComplete') {
      updates.completions = { increment: 1 };
    }
    if (event.metadata?.seconds && typeof event.metadata.seconds === 'number') {
      // Calculate new average
      const newAvg = Math.round(
        (existingStats.avgTimeSpent * existingStats.reads + event.metadata.seconds) /
          (existingStats.reads + 1)
      );
      updates.avgTimeSpent = newAvg;
    }

    if (Object.keys(updates).length > 0) {
      await tx.chapterStats.update({
        where: { chapterId: event.chapterId },
        data: updates,
      });
    }
  }

  // Update chapter view count for reads
  if (event.type === 'chapterRead') {
    await tx.chapter.update({
      where: { id: event.chapterId },
      data: { viewCount: { increment: 1 } },
    });
  }
}

// POST /api/analytics/track - Track analytics events
export async function POST(request: NextRequest) {
  try {
    // Check rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const isAllowed = await checkRateLimit(ip);

    if (!isAllowed) {
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
