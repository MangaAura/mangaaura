/**
 * Advanced Analytics System for Manga Platform
 * Provides event tracking, batch processing, and rate limiting
 */

import { prisma } from './prisma';
import { redis } from './redis';

// Types
export type AnalyticsEventType = 
  | 'pageView' 
  | 'chapterRead' 
  | 'timeSpent' 
  | 'scrollDepth' 
  | 'chapterComplete'
  | 'mangaView'
  | 'searchQuery'
  | 'bookmarkAdd'
  | 'ratingGiven'
  | 'shareEvent'
  | 'commentPost';

interface AnalyticsEventData {
  type: AnalyticsEventType;
  mangaId?: string;
  chapterId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

interface BatchConfig {
  maxSize: number;
  flushInterval: number; // milliseconds
  maxRetries: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Default configurations
const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxSize: 100,
  flushInterval: 5000,
  maxRetries: 3
};

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100
};

/**
 * Analytics Tracker Class
 * Handles event batching, rate limiting, and processing
 */
export class AnalyticsTracker {
  private eventQueue: AnalyticsEventData[] = [];
  private batchConfig: BatchConfig;
  private rateLimitConfig: RateLimitConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    batchConfig: Partial<BatchConfig> = {},
    rateLimitConfig: Partial<RateLimitConfig> = {}
  ) {
    this.batchConfig = { ...DEFAULT_BATCH_CONFIG, ...batchConfig };
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...rateLimitConfig };
    this.startFlushTimer();
  }

  /**
   * Check rate limit for a specific user/session
   */
  private async checkRateLimit(key: string): Promise<boolean> {
    const rateLimitKey = `rate_limit:analytics:${key}`;
    const current = await redis.incr(rateLimitKey);
    
    if (current === 1) {
      await redis.pexpire(rateLimitKey, this.rateLimitConfig.windowMs);
    }
    
    return current <= this.rateLimitConfig.maxRequests;
  }

  /**
   * Track a page view event
   */
  async trackPageView(data: Omit<AnalyticsEventData, 'type'>): Promise<void> {
    await this.trackEvent({ ...data, type: 'pageView' });
  }

  /**
   * Track chapter read event
   */
  async trackChapterRead(
    mangaId: string,
    chapterId: string,
    data: Omit<AnalyticsEventData, 'type' | 'mangaId' | 'chapterId'>
  ): Promise<void> {
    await this.trackEvent({
      ...data,
      type: 'chapterRead',
      mangaId,
      chapterId
    });
  }

  /**
   * Track time spent on page/chapter
   */
  async trackTimeSpent(
    mangaId: string,
    chapterId: string,
    seconds: number,
    data: Omit<AnalyticsEventData, 'type' | 'mangaId' | 'chapterId' | 'metadata'>
  ): Promise<void> {
    await this.trackEvent({
      ...data,
      type: 'timeSpent',
      mangaId,
      chapterId,
      metadata: { seconds }
    });
  }

  /**
   * Track scroll depth percentage
   */
  async trackScrollDepth(
    mangaId: string,
    chapterId: string,
    depth: number,
    data: Omit<AnalyticsEventData, 'type' | 'mangaId' | 'chapterId' | 'metadata'>
  ): Promise<void> {
    await this.trackEvent({
      ...data,
      type: 'scrollDepth',
      mangaId,
      chapterId,
      metadata: { depth: Math.min(100, Math.max(0, depth)) }
    });
  }

  /**
   * Track chapter completion
   */
  async trackChapterComplete(
    mangaId: string,
    chapterId: string,
    data: Omit<AnalyticsEventData, 'type' | 'mangaId' | 'chapterId'>
  ): Promise<void> {
    await this.trackEvent({
      ...data,
      type: 'chapterComplete',
      mangaId,
      chapterId
    });
  }

  /**
   * Generic event tracking with rate limiting
   */
  async trackEvent(event: AnalyticsEventData): Promise<void> {
    const rateLimitKey = event.userId || event.ipAddress || 'anonymous';
    
    const isAllowed = await this.checkRateLimit(rateLimitKey);
    if (!isAllowed) {
      console.warn(`Rate limit exceeded for ${rateLimitKey}`);
      return;
    }

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchConfig.maxSize) {
      await this.flush();
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.batchConfig.flushInterval);
  }

  /**
   * Flush events to database
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.processBatch(eventsToProcess);
    } catch (error) {
      console.error('Failed to process analytics batch:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process batch of events
   */
  private async processBatch(events: AnalyticsEventData[]): Promise<void> {
    const sessionId = this.generateSessionId();
    const timestamp = new Date();

    await prisma.$transaction(async (tx: typeof prisma) => {
      // Batch insert events
      await tx.analyticsEvent.createMany({
        data: events.map(event => ({
          type: event.type,
          mangaId: event.mangaId,
          chapterId: event.chapterId,
          userId: event.userId,
          sessionId,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          timestamp,
          userAgent: event.userAgent,
          ipAddress: this.anonymizeIp(event.ipAddress),
          referrer: event.referrer
        })),
        skipDuplicates: true
      });

      // Update daily stats for manga-related events
      await this.updateDailyStats(tx, events, timestamp);

      // Update hourly stats
      await this.updateHourlyStats(tx, events, timestamp);
    });
  }

  /**
   * Update daily statistics
   */
  private async updateDailyStats(
    tx: any,
    events: AnalyticsEventData[],
    timestamp: Date
  ): Promise<void> {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);

    // Group events by mangaId
    const mangaEvents = new Map<string, AnalyticsEventData[]>();
    
    for (const event of events) {
      if (event.mangaId) {
        const existing = mangaEvents.get(event.mangaId) || [];
        existing.push(event);
        mangaEvents.set(event.mangaId, existing);
      }
    }

    for (const [mangaId, mangaEventList] of mangaEvents) {
      const views = mangaEventList.filter(e => e.type === 'pageView').length;
      const reads = mangaEventList.filter(e => e.type === 'chapterRead').length;
      
      // Calculate unique visitors
      const uniqueUsers = new Set(
        mangaEventList.map(e => e.userId).filter(Boolean)
      ).size;

      // Upsert daily stats
      await tx.dailyStats.upsert({
        where: {
          date_mangaId: { date, mangaId }
        },
        create: {
          date,
          mangaId,
          views,
          reads,
          uniqueVisitors: uniqueUsers
        },
        update: {
          views: { increment: views },
          reads: { increment: reads },
          uniqueVisitors: { increment: uniqueUsers }
        }
      });
    }
  }

  /**
   * Update hourly statistics
   */
  private async updateHourlyStats(
    tx: any,
    events: AnalyticsEventData[],
    timestamp: Date
  ): Promise<void> {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    const hour = timestamp.getHours();

    const mangaEvents = new Map<string, AnalyticsEventData[]>();
    
    for (const event of events) {
      if (event.mangaId) {
        const existing = mangaEvents.get(event.mangaId) || [];
        existing.push(event);
        mangaEvents.set(event.mangaId, existing);
      }
    }

    for (const [mangaId, mangaEventList] of mangaEvents) {
      const views = mangaEventList.filter(e => e.type === 'pageView').length;
      const reads = mangaEventList.filter(e => e.type === 'chapterRead').length;

      await tx.hourlyStats.upsert({
        where: {
          date_hour_mangaId: { date, hour, mangaId }
        },
        create: {
          date,
          hour,
          mangaId,
          views,
          reads
        },
        update: {
          views: { increment: views },
          reads: { increment: reads }
        }
      });
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Anonymize IP address (GDPR compliance)
   */
  private anonymizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    
    // For IPv4, remove last octet
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    
    // For IPv6, keep first 4 segments
    if (ip.includes(':')) {
      return ip.split(':').slice(0, 4).join(':') + '::';
    }
    
    return ip;
  }

  /**
   * Destroy tracker and cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Singleton instance for server-side usage
let globalTracker: AnalyticsTracker | null = null;

export function getAnalyticsTracker(): AnalyticsTracker {
  if (!globalTracker) {
    globalTracker = new AnalyticsTracker();
  }
  return globalTracker;
}

// Client-side tracker for browser events
export class ClientAnalyticsTracker {
  private queue: AnalyticsEventData[] = [];
  private batchSize = 10;
  private flushInterval = 5000;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startTimer();
    this.setupVisibilityHandler();
  }

  /**
   * Track event from client
   */
  async track(event: AnalyticsEventData): Promise<void> {
    this.queue.push(event);
    
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(mangaId?: string): void {
    this.track({
      type: 'pageView',
      mangaId,
      metadata: {
        url: window.location.href,
        title: document.title
      }
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(mangaId: string, chapterId: string, depth: number): void {
    this.track({
      type: 'scrollDepth',
      mangaId,
      chapterId,
      metadata: { depth }
    });
  }

  /**
   * Track time spent
   */
  trackTimeSpent(mangaId: string, chapterId: string, seconds: number): void {
    this.track({
      type: 'timeSpent',
      mangaId,
      chapterId,
      metadata: { seconds }
    });
  }

  /**
   * Flush events to API
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error('Failed to send analytics');
      }
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }

  /**
   * Start flush timer
   */
  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Setup visibility change handler
   */
  private setupVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

// Analytics query helpers
export async function getMangaAnalytics(
  mangaId: string,
  dateFrom: Date,
  dateTo: Date
) {
  const [dailyStats, hourlyStats, totalEvents] = await Promise.all([
    prisma.dailyStats.findMany({
      where: {
        mangaId,
        date: { gte: dateFrom, lte: dateTo }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.hourlyStats.findMany({
      where: {
        mangaId,
        date: { gte: dateFrom, lte: dateTo }
      },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }]
    }),
    prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        mangaId,
        timestamp: { gte: dateFrom, lte: dateTo }
      },
      _count: { type: true }
    })
  ]);

  return {
    dailyStats,
    hourlyStats,
    eventCounts: totalEvents.reduce((acc, curr) => {
      acc[curr.type] = curr._count.type;
      return acc;
    }, {} as Record<string, number>)
  };
}

export async function getCreatorAnalytics(
  authorId: string,
  dateFrom: Date,
  dateTo: Date
) {
  // Get all mangas by creator
  const mangas = await prisma.mangaSeries.findMany({
    where: { authorId },
    select: { id: true, title: true }
  });

  const mangaIds = mangas.map(m => m.id);

  const [dailyStats, topChapters, retention] = await Promise.all([
    prisma.dailyStats.findMany({
      where: {
        mangaId: { in: mangaIds },
        date: { gte: dateFrom, lte: dateTo }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.analyticsEvent.groupBy({
      by: ['chapterId'],
      where: {
        mangaId: { in: mangaIds },
        type: 'chapterRead',
        timestamp: { gte: dateFrom, lte: dateTo }
      },
      _count: { chapterId: true },
      orderBy: { _count: { chapterId: 'desc' } },
      take: 10
    }),
    prisma.readerRetention.findMany({
      where: {
        mangaId: { in: mangaIds },
        date: { gte: dateFrom, lte: dateTo }
      },
      orderBy: { date: 'asc' }
    })
  ]);

  // Calculate totals
  const totals = dailyStats.reduce(
    (acc, day) => ({
      views: acc.views + day.views,
      reads: acc.reads + day.reads,
      uniqueVisitors: acc.uniqueVisitors + day.uniqueVisitors,
      avgTimeSpent: acc.avgTimeSpent + day.avgTimeSpent
    }),
    { views: 0, reads: 0, uniqueVisitors: 0, avgTimeSpent: 0 }
  );

  const daysCount = dailyStats.length || 1;

  return {
    mangas,
    dailyStats,
    totals: {
      ...totals,
      avgTimeSpent: Math.round(totals.avgTimeSpent / daysCount)
    },
    topChapters,
    retention
  };
}
