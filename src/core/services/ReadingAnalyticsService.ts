import type { IReadingAnalyticsRepository, ReadingEvent, ReadingStats, UserReadingHistory, CreatorStats, ChapterLogsResult } from './IReadingAnalyticsRepository';

export type { ReadingEventType, ReadingEvent, ReadingStats, UserReadingHistory, ChapterLogsResult } from './IReadingAnalyticsRepository';

export interface TrackEventInput {
  userId: string;
  chapterId: string;
  mangaId: string;
  event: ReadingEvent;
}

export class ReadingAnalyticsService {
  constructor(private readonly repo: IReadingAnalyticsRepository) {}

  async trackReadingEvent(
    userId: string,
    chapterId: string,
    mangaId: string,
    event: ReadingEvent
  ): Promise<{
    id: string;
    totalTimeSeconds: number;
    pagesViewed: number[];
    completed: boolean;
    readingSpeed: number;
  }> {
    const log = await this.repo.findOrCreateLog(userId, chapterId, mangaId);

    log.events.push(event);

    if (event.data?.duration) {
      log.totalTimeSeconds += event.data.duration;
    }

    if (event.data?.pageNumber && !log.pagesViewed.includes(event.data.pageNumber)) {
      log.pagesViewed.push(event.data.pageNumber);
    }

    if (event.type === 'completion' && !log.completed) {
      log.completed = true;
      log.completedAt = new Date();
    }

    if (log.totalTimeSeconds > 0 && log.pagesViewed.length > 0) {
      const minutes = log.totalTimeSeconds / 60;
      if (minutes > 0) {
        log.readingSpeed = Math.round(log.pagesViewed.length / minutes);
      }
    }

    await this.repo.saveLog(log);

    return {
      id: log.id,
      totalTimeSeconds: log.totalTimeSeconds,
      pagesViewed: log.pagesViewed,
      completed: log.completed,
      readingSpeed: log.readingSpeed,
    };
  }

  async getReadingStats(chapterId: string): Promise<ReadingStats> {
    return this.repo.getChapterStats(chapterId);
  }

  async getUserReadingHistory(userId: string): Promise<UserReadingHistory> {
    return this.repo.getUserHistory(userId);
  }

  async getCreatorStats(
    mangaIds: string[],
    dateFrom: Date,
    dateTo: Date
  ): Promise<CreatorStats> {
    return this.repo.getCreatorStats(mangaIds, dateFrom, dateTo);
  }

  async getChapterReadingLogs(
    chapterId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ChapterLogsResult> {
    return this.repo.getChapterLogs(chapterId, options);
  }

  async hasUserCompletedChapter(userId: string, chapterId: string): Promise<boolean> {
    return this.repo.hasUserCompleted(userId, chapterId);
  }
}

export let readingAnalyticsService: ReadingAnalyticsService | undefined;

export function initializeReadingAnalyticsService(
  repo: IReadingAnalyticsRepository
): ReadingAnalyticsService {
  const service = new ReadingAnalyticsService(repo);
  readingAnalyticsService = service;
  return service;
}

export default readingAnalyticsService;
