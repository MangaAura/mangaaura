import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// ─── Validation schema matching reportWebVitals payload ────────────────────

const webVitalSchema = z.object({
  id: z.string().min(1),
  name: z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']),
  value: z.number().finite(),
  label: z.string(),
  page: z.string().min(1),
  timestamp: z.number().positive(),
});

// ─── Rate limiting: 60 web vitals per minute per IP ───────────────────────

const RATE_LIMIT = 60;
const RATE_WINDOW = 60; // seconds

// ─── Thresholds for what constitutes "poor" performance ───────────────────
// NOTE: CLS is pre-multiplied by 1000 before sending (see reportWebVitals)

const POOR_THRESHOLDS: Record<string, number> = {
  LCP: 2500,   // ms
  INP: 200,    // ms
  CLS: 100,    // 0.1 × 1000
  FCP: 1800,   // ms
  TTFB: 800,   // ms
};

// ─── POST /api/analytics/web-vitals ───────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── Rate limiting by IP ────────────────────────────────────────────
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    const rlKey = `ratelimit:web-vitals:${ip}`;
    const { allowed } = await rateLimit(rlKey, RATE_LIMIT, RATE_WINDOW);

    if (!allowed) {
      // Silently drop — web vitals are best-effort analytics
      return NextResponse.json(null, { status: 202 });
    }

    // ── Parse and validate payload ─────────────────────────────────────
    const body = await request.json();
    const result = webVitalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { id, name, value, label, page, timestamp } = result.data;

    // ── Persist to database ────────────────────────────────────────────
    const isPoor =
      POOR_THRESHOLDS[name] !== undefined && value > POOR_THRESHOLDS[name];

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'web_vital',
        metadata: JSON.stringify({
          vitalId: id,
          vitalName: name,
          value,
          label,
          page,
          isPoor,
          clientTimestamp: new Date(timestamp).toISOString(),
          userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
        }),
      },
    });

    // ── Aggregate into hourly stats for dashboards ─────────────────────
    const now = new Date();
    const hourDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
      ),
    );

    await prisma.hourlyStats.upsert({
      where: {
        hour_eventType: {
          hour: hourDate,
          eventType: `web_vital_${name}`,
        },
      },
      create: {
        hour: hourDate,
        eventType: `web_vital_${name}`,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    // ── Return 202 Accepted (sendBeacon doesn't need body) ────────────
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    console.error('[WebVitals API] Error:', error);
    // Don't expose internal errors; analytics are best-effort
    return NextResponse.json({ accepted: false }, { status: 202 });
  }
}
