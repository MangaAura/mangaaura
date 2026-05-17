export type ReadingEventType = 'scroll' | 'page_view' | 'completion';

export interface ReadingEvent {
  type: ReadingEventType;
  timestamp: Date;
  data?: {
    pageNumber?: number;
    scrollDepth?: number;
    duration?: number;
  };
}

export interface ReadingLogRecord {
  id: string;
  userId: string;
  chapterId: string;
  mangaId: string;
  events: ReadingEvent[];
  totalTimeSeconds: number;
  pagesViewed: number[];
  completed: boolean;
  completedAt?: Date;
  readingSpeed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingStats {
  chapterId: string;
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  avgReadingSpeed: number;
  mostViewedPages: Array<{ page: number; views: number }>;
  dailyStats: Array<{ date: string; reads: number; completions: number }>;
}

export interface UserReadingHistory {
  userId: string;
  totalChaptersRead: number;
  totalCompletions: number;
  totalTimeSeconds: number;
  recentReads: Array<{
    chapterId: string;
    mangaId: string;
    completed: boolean;
    completedAt?: Date;
    totalTimeSeconds: number;
    readingSpeed: number;
  }>;
  readingByManga: Array<{
    mangaId: string;
    chaptersRead: number;
    totalTimeSeconds: number;
  }>;
}

export type CreatorStats = {
  totalViews: number;
  totalReads: number;
  totalCompletions: number;
  completionRate: number;
  avgTimeSeconds: number;
  chapterStats: Array<{
    chapterId: string;
    mangaId: string;
    reads: number;
    completions: number;
    completionRate: number;
  }>;
};

export type ChapterLogsResult = {
  logs: ReadingLogRecord[];
  total: number;
};

export interface IReadingAnalyticsRepository {
  logReading(data: {
    userId: string;
    mangaId: string;
    chapterId: string;
    chapterNumber: number;
    pagesRead: number;
    totalPages: number;
    timeSpent: number;
    completed: boolean;
  }): Promise<void>;

  getReadingStats(userId: string, mangaId?: string): Promise<{
    totalChaptersRead: number;
    totalPagesRead: number;
    totalTimeSpent: number;
    averageCompletionRate: number;
    readingStreak: number;
    lastReadAt: Date | null;
  }>;

  getPopularMangas(limit?: number): Promise<Array<{
    mangaId: string;
    totalReaders: number;
    totalReads: number;
  }>>;

  findOrCreateLog(userId: string, chapterId: string, mangaId: string): Promise<ReadingLogRecord>;

  saveLog(log: ReadingLogRecord): Promise<void>;

  getChapterStats(chapterId: string): Promise<ReadingStats>;

  getUserHistory(userId: string): Promise<UserReadingHistory>;

  getCreatorStats(mangaIds: string[], dateFrom: Date, dateTo: Date): Promise<CreatorStats>;

  getChapterLogs(chapterId: string, options?: { limit?: number; offset?: number }): Promise<ChapterLogsResult>;

  hasUserCompleted(userId: string, chapterId: string): Promise<boolean>;
}
