import dbConnect from '@/lib/mongoose';
import { ReadingLogModel, IReadingLog } from '@/infrastructure/persistence/mongodb/models/ReadingLog';
import type {
  IReadingAnalyticsRepository,
  ReadingEvent,
  ReadingLogRecord,
  ReadingStats,
  UserReadingHistory,
  CreatorStats,
  ChapterLogsResult,
} from '@/core/services/IReadingAnalyticsRepository';

function toRecord(doc: IReadingLog): ReadingLogRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    chapterId: doc.chapterId,
    mangaId: doc.mangaId,
    events: doc.events.map((e: any) => ({
      type: e.type as ReadingEvent['type'],
      timestamp: e.timestamp,
      data: e.data ? { pageNumber: e.data.pageNumber, scrollDepth: e.data.scrollDepth, duration: e.data.duration } : undefined,
    })),
    totalTimeSeconds: doc.totalTimeSeconds,
    pagesViewed: doc.pagesViewed,
    completed: doc.completed,
    completedAt: doc.completedAt,
    readingSpeed: doc.readingSpeed,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoReadingAnalyticsRepository implements IReadingAnalyticsRepository {
  async logReading(data: {
    userId: string;
    mangaId: string;
    chapterId: string;
    chapterNumber: number;
    pagesRead: number;
    totalPages: number;
    timeSpent: number;
    completed: boolean;
  }): Promise<void> {
    await dbConnect();
    await ReadingLogModel.create({
      userId: data.userId,
      chapterId: data.chapterId,
      mangaId: data.mangaId,
      events: [],
      totalTimeSeconds: data.timeSpent,
      pagesViewed: Array.from({ length: data.pagesRead }, (_, i) => i + 1),
      completed: data.completed,
      completedAt: data.completed ? new Date() : undefined,
      readingSpeed: data.timeSpent > 0 ? Math.round(data.pagesRead / (data.timeSpent / 60)) : 0,
    });
  }

  async getReadingStats(userId: string, mangaId?: string): Promise<{
    totalChaptersRead: number;
    totalPagesRead: number;
    totalTimeSpent: number;
    averageCompletionRate: number;
    readingStreak: number;
    lastReadAt: Date | null;
  }> {
    await dbConnect();
    const match: any = { userId };
    if (mangaId) match.mangaId = mangaId;

    const logs = await ReadingLogModel.find(match).sort({ createdAt: -1 }).lean();
    const totalChaptersRead = logs.length;
    const totalPagesRead = logs.reduce((sum: number, l: any) => sum + (l.pagesViewed?.length || 0), 0);
    const totalTimeSpent = logs.reduce((sum: number, l: any) => sum + (l.totalTimeSeconds || 0), 0);
    const completedLogs = logs.filter((l: any) => l.completed);
    const averageCompletionRate = logs.length > 0 ? Math.round((completedLogs.length / logs.length) * 100) : 0;
    const lastReadAt = logs.length > 0 ? logs[0].createdAt : null;

    const readingStreak = this.calculateStreak(logs.map((l: any) => l.createdAt));

    return { totalChaptersRead, totalPagesRead, totalTimeSpent, averageCompletionRate, readingStreak, lastReadAt };
  }

  async getPopularMangas(limit: number = 10): Promise<Array<{ mangaId: string; totalReaders: number; totalReads: number }>> {
    await dbConnect();
    const results = await ReadingLogModel.aggregate([
      {
        $group: {
          _id: '$mangaId',
          totalReaders: { $addToSet: '$userId' },
          totalReads: { $sum: 1 },
        },
      },
      {
        $project: {
          mangaId: '$_id',
          totalReaders: { $size: '$totalReaders' },
          totalReads: 1,
        },
      },
      { $sort: { totalReads: -1 } },
      { $limit: limit },
    ]);
    return results.map((r: any) => ({ mangaId: r.mangaId, totalReaders: r.totalReaders, totalReads: r.totalReads }));
  }

  async findOrCreateLog(userId: string, chapterId: string, mangaId: string): Promise<ReadingLogRecord> {
    await dbConnect();
    let doc = await ReadingLogModel.findOne({ userId, chapterId, mangaId });
    if (!doc) {
      doc = await ReadingLogModel.create({
        userId,
        chapterId,
        mangaId,
        events: [],
        totalTimeSeconds: 0,
        pagesViewed: [],
        completed: false,
        readingSpeed: 0,
      });
    }
    return toRecord(doc);
  }

  async saveLog(log: ReadingLogRecord): Promise<void> {
    await dbConnect();
    await ReadingLogModel.findByIdAndUpdate(log.id, {
      events: log.events,
      totalTimeSeconds: log.totalTimeSeconds,
      pagesViewed: log.pagesViewed,
      completed: log.completed,
      completedAt: log.completedAt,
      readingSpeed: log.readingSpeed,
    });
  }

  async getChapterStats(chapterId: string): Promise<ReadingStats> {
    await dbConnect();

    const [totalStats, completionStats, timeStats, speedStats, dailyAggregation] = await Promise.all([
      ReadingLogModel.countDocuments({ chapterId }),
      ReadingLogModel.countDocuments({ chapterId, completed: true }),
      ReadingLogModel.aggregate([
        { $match: { chapterId } },
        { $group: { _id: null, avgTime: { $avg: '$totalTimeSeconds' } } },
      ]),
      ReadingLogModel.aggregate([
        { $match: { chapterId, readingSpeed: { $gt: 0 } } },
        { $group: { _id: null, avgSpeed: { $avg: '$readingSpeed' } } },
      ]),
      ReadingLogModel.aggregate([
        { $match: { chapterId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            reads: { $sum: 1 },
            completions: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    const pageViews = await ReadingLogModel.aggregate([
      { $match: { chapterId } },
      { $unwind: '$pagesViewed' },
      { $group: { _id: '$pagesViewed', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
    ]);

    const totalReads = totalStats || 0;
    const totalCompletions = completionStats || 0;
    const completionRate = totalReads > 0 ? Math.round((totalCompletions / totalReads) * 100) : 0;

    return {
      chapterId,
      totalReads,
      totalCompletions,
      completionRate,
      avgTimeSeconds: Math.round(timeStats[0]?.avgTime || 0),
      avgReadingSpeed: Math.round(speedStats[0]?.avgSpeed || 0),
      mostViewedPages: pageViews.map((p: any) => ({ page: p._id, views: p.views })),
      dailyStats: dailyAggregation.map((d: any) => ({ date: d._id, reads: d.reads, completions: d.completions })),
    };
  }

  async getUserHistory(userId: string): Promise<UserReadingHistory> {
    await dbConnect();
    const docs = await ReadingLogModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const logs = docs.map(toRecord);

    const totalChaptersRead = logs.length;
    const totalCompletions = logs.filter((l) => l.completed).length;
    const totalTimeSeconds = logs.reduce((sum, l) => sum + l.totalTimeSeconds, 0);

    const recentReads = logs.slice(0, 20).map((log) => ({
      chapterId: log.chapterId,
      mangaId: log.mangaId,
      completed: log.completed,
      completedAt: log.completedAt,
      totalTimeSeconds: log.totalTimeSeconds,
      readingSpeed: log.readingSpeed,
    }));

    const mangaMap = new Map<string, { chaptersRead: number; totalTimeSeconds: number }>();
    logs.forEach((log) => {
      const existing = mangaMap.get(log.mangaId);
      if (existing) {
        existing.chaptersRead += 1;
        existing.totalTimeSeconds += log.totalTimeSeconds;
      } else {
        mangaMap.set(log.mangaId, { chaptersRead: 1, totalTimeSeconds: log.totalTimeSeconds });
      }
    });

    const readingByManga = Array.from(mangaMap.entries()).map(([mangaId, stats]) => ({ mangaId, ...stats }));

    return { userId, totalChaptersRead, totalCompletions, totalTimeSeconds, recentReads, readingByManga };
  }

  async getCreatorStats(mangaIds: string[], dateFrom: Date, dateTo: Date): Promise<CreatorStats> {
    await dbConnect();
    const matchClause: any = {
      mangaId: { $in: mangaIds },
      createdAt: { $gte: dateFrom, $lte: dateTo },
    };

    const stats = await ReadingLogModel.aggregate([
      { $match: matchClause },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          totalCompletions: { $sum: { $cond: ['$completed', 1, 0] } },
          avgTime: { $avg: '$totalTimeSeconds' },
        },
      },
    ]);

    const chapterStats = await ReadingLogModel.aggregate([
      { $match: matchClause },
      {
        $group: {
          _id: { chapterId: '$chapterId', mangaId: '$mangaId' },
          reads: { $sum: 1 },
          completions: { $sum: { $cond: ['$completed', 1, 0] } },
        },
      },
      {
        $project: {
          chapterId: '$_id.chapterId',
          mangaId: '$_id.mangaId',
          reads: 1,
          completions: 1,
          completionRate: { $multiply: [{ $divide: ['$completions', '$reads'] }, 100] },
        },
      },
      { $sort: { reads: -1 } },
    ]);

    const result = stats[0] || { totalViews: 0, totalCompletions: 0, avgTime: 0 };
    const totalReads = result.totalViews;
    const totalCompletions = result.totalCompletions;

    return {
      totalViews: totalReads,
      totalReads,
      totalCompletions,
      completionRate: totalReads > 0 ? Math.round((totalCompletions / totalReads) * 100) : 0,
      avgTimeSeconds: Math.round(result.avgTime || 0),
      chapterStats: chapterStats.map((c: any) => ({
        chapterId: c.chapterId,
        mangaId: c.mangaId,
        reads: c.reads,
        completions: c.completions,
        completionRate: Math.round(c.completionRate || 0),
      })),
    };
  }

  async getChapterLogs(chapterId: string, options: { limit?: number; offset?: number } = {}): Promise<ChapterLogsResult> {
    await dbConnect();
    const { limit = 20, offset = 0 } = options;

    const [docs, total] = await Promise.all([
      ReadingLogModel.find({ chapterId }).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      ReadingLogModel.countDocuments({ chapterId }),
    ]);

    return {
      logs: docs.map((d: any) => ({
        id: d._id.toString(),
        userId: d.userId,
        chapterId: d.chapterId,
        mangaId: d.mangaId,
        events: (d.events || []).map((e: any) => ({
          type: e.type as ReadingEvent['type'],
          timestamp: e.timestamp,
          data: e.data ? { pageNumber: e.data.pageNumber, scrollDepth: e.data.scrollDepth, duration: e.data.duration } : undefined,
        })),
        totalTimeSeconds: d.totalTimeSeconds,
        pagesViewed: d.pagesViewed || [],
        completed: d.completed,
        completedAt: d.completedAt,
        readingSpeed: d.readingSpeed,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      total,
    };
  }

  async hasUserCompleted(userId: string, chapterId: string): Promise<boolean> {
    await dbConnect();
    const doc = await ReadingLogModel.findOne({ userId, chapterId, completed: true });
    return !!doc;
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const uniqueDays = [...new Set(dates.map((d) => d.toISOString().slice(0, 10)))].sort().reverse();
    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffMs = prev.getTime() - curr.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
