import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { readingAnalyticsService } from '@/core/services/ReadingAnalyticsService';
import type { ReadingEventType } from '@/core/services/IReadingAnalyticsRepository';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const readingEventSchema = z.object({
  chapterId: z.string().min(1),
  mangaId: z.string().min(1),
  event: z.object({
    type: z.enum(['scroll', 'page_view', 'completion']),
    timestamp: z.string().datetime().optional(),
    data: z.object({
      pageNumber: z.number().optional(),
      scrollDepth: z.number().optional(),
      duration: z.number().optional(),
    }).optional(),
  }),
});

const batchEventsSchema = z.object({
  chapterId: z.string().min(1),
  mangaId: z.string().min(1),
  events: z.array(z.object({
    type: z.enum(['scroll', 'page_view', 'completion']),
    timestamp: z.string().datetime().optional(),
    data: z.object({
      pageNumber: z.number().optional(),
      scrollDepth: z.number().optional(),
      duration: z.number().optional(),
    }).optional(),
  })).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    if (!readingAnalyticsService) {
      return NextResponse.json(
        { error: 'Servicio no inicializado' },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (body.events && Array.isArray(body.events)) {
      const result = batchEventsSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: result.error.flatten() },
          { status: 400 }
        );
      }

      const { chapterId, mangaId, events } = result.data;

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const savedLogs = await Promise.all(
        events.map((evt) =>
        readingAnalyticsService!.trackReadingEvent(
          userId,
          chapterId,
          mangaId,
          {
            type: evt.type as ReadingEventType,
            timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
            data: evt.data,
          }
        )
      )
    );

      return NextResponse.json({
        success: true,
        eventsProcessed: savedLogs.length,
        logs: savedLogs.map((log) => ({
          id: log.id,
          totalTimeSeconds: log.totalTimeSeconds,
          pagesViewed: log.pagesViewed.length,
          completed: log.completed,
        })),
      });
    } else {
      const result = readingEventSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: result.error.flatten() },
          { status: 400 }
        );
      }

      const { chapterId, mangaId, event } = result.data;

      const log = await readingAnalyticsService.trackReadingEvent(
        session.user.id,
        chapterId,
        mangaId,
        {
          type: event.type as ReadingEventType,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          data: event.data,
        }
      );

      return NextResponse.json({
        success: true,
        log: {
          id: log.id,
          totalTimeSeconds: log.totalTimeSeconds,
          pagesViewed: log.pagesViewed.length,
          completed: log.completed,
          readingSpeed: log.readingSpeed,
        },
      });
    }
  } catch (error) {
    console.error('Error saving reading event:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
