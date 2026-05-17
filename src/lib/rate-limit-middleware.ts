import { NextResponse } from 'next/server';
import { rateLimit, getRateLimitKey } from './rate-limit';

export type LimitConfig = {
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS: Record<string, LimitConfig> = {
  default: { limit: 60, windowSeconds: 60 },
  auth: { limit: 5, windowSeconds: 300 },
  register: { limit: 5, windowSeconds: 3600 },
  comments: { limit: 10, windowSeconds: 60 },
  search: { limit: 30, windowSeconds: 60 },
  economy: { limit: 10, windowSeconds: 60 },
  follow: { limit: 20, windowSeconds: 60 },
  notifications: { limit: 30, windowSeconds: 60 },
  upload: { limit: 10, windowSeconds: 60 },
  contact: { limit: 3, windowSeconds: 3600 },
  dmca: { limit: 3, windowSeconds: 86400 },
  report: { limit: 5, windowSeconds: 300 },
  messages: { limit: 20, windowSeconds: 60 },
  library: { limit: 30, windowSeconds: 60 },
};

export async function withRateLimit(
  request: { headers: { get(name: string): string | null } },
  userId: string | undefined,
  routeKey: keyof typeof RATE_LIMITS | 'default' = 'default'
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[routeKey] || RATE_LIMITS.default;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const identifier = userId || ip;
  const key = getRateLimitKey(routeKey, identifier);

  const result = await rateLimit(key, config.limit, config.windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
