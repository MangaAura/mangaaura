/**
 * ReadingAnalyticsService
 *
 * Servicio para gestionar analytics de lectura usando MongoDB.
 * Guarda eventos de lectura, calcula estadísticas y genera reportes.
 */

import dbConnect from '@/lib/mongoose';
import { ReadingLogModel, IReadingLog } from '@/infrastructure/persistence/mongodb/models/ReadingLog';
import { Types } from 'mongoose';

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

export interface TrackEventInput {
  userId: string;
  chapterId: string;
  mangaId: string;
  event: ReadingEvent;
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

export class ReadingAnalyticsService {
  private static instance: ReadingAnalyticsService;

  private constructor() {}

  public static getInstance(): ReadingAnalyticsService {
    if (!ReadingAnalyticsService.instance) {
      ReadingAnalyticsService.instance = new ReadingAnalyticsService();
    }
    return ReadingAnalyticsService.instance;
  }

  /**
   * Track a reading event
   */
  async trackReadingEvent(
    userId: string,
    chapterId: string,
    mangaId: string,
    event: ReadingEvent
  ): Promise<IReadingLog> {
    await dbConnect();

    // Buscar o crear el log de lectura
    let readingLog = await ReadingLogModel.findOne({
      userId,
      chapterId,
      mangaId,
    });

    if (!readingLog) {
      readingLog = await ReadingLogModel.create({
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

    // Agregar el evento
    readingLog.events.push(event);

    // Actualizar tiempo total si hay duración
    if (event.data?.duration) {
      readingLog.totalTimeSeconds += event.data.duration;
    }

    // Actualizar páginas vistas
    if (event.data?.pageNumber && !readingLog.pagesViewed.includes(event.data.pageNumber)) {
      readingLog.pagesViewed.push(event.data.pageNumber);
    }

    // Marcar como completado si es evento de completion
    if (event.type === 'completion' && !readingLog.completed) {
      readingLog.completed = true;
      readingLog.completedAt = new Date();
    }

    // Calcular velocidad de lectura si hay tiempo y páginas
    if (readingLog.totalTimeSeconds > 0 && readingLog.pagesViewed.length > 0) {
      const minutes = readingLog.totalTimeSeconds / 60;
      if (minutes > 0) {
        readingLog.readingSpeed = Math.round(readingLog.pagesViewed.length / minutes);
      }
    }

    await readingLog.save();
    return readingLog;
  }

  /**
   * Obtener estadísticas de lectura para un capítulo
   */
  async getReadingStats(chapterId: string): Promise<ReadingStats> {
    await dbConnect();

    const [
      totalStats,
      completionStats,
      timeStats,
      speedStats,
      dailyAggregation,
    ] = await Promise.all([
      // Total de lecturas
      ReadingLogModel.countDocuments({ chapterId }),

      // Completados
      ReadingLogModel.countDocuments({ chapterId, completed: true }),

      // Tiempo promedio
      ReadingLogModel.aggregate([
        { $match: { chapterId } },
        { $group: { _id: null, avgTime: { $avg: '$totalTimeSeconds' } } },
      ]),

      // Velocidad promedio
      ReadingLogModel.aggregate([
        { $match: { chapterId, readingSpeed: { $gt: 0 } } },
        { $group: { _id: null, avgSpeed: { $avg: '$readingSpeed' } } },
      ]),

      // Estadísticas diarias
      ReadingLogModel.aggregate([
        { $match: { chapterId } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            reads: { $sum: 1 },
            completions: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    // Calcular páginas más vistas
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
    const avgTimeSeconds = timeStats[0]?.avgTime || 0;
    const avgReadingSpeed = speedStats[0]?.avgSpeed || 0;

    return {
      chapterId,
      totalReads,
      totalCompletions,
      completionRate,
      avgTimeSeconds: Math.round(avgTimeSeconds),
      avgReadingSpeed: Math.round(avgReadingSpeed),
      mostViewedPages: pageViews.map((p) => ({ page: p._id, views: p.views })),
      dailyStats: dailyAggregation.map((d) => ({
        date: d._id,
        reads: d.reads,
        completions: d.completions,
      })),
    };
  }

  /**
   * Obtener historial de lectura de un usuario
   */
  async getUserReadingHistory(userId: string): Promise<UserReadingHistory> {
    await dbConnect();

    const logs = await ReadingLogModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

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

    // Agrupar por manga
    const mangaMap = new Map<string, { chaptersRead: number; totalTimeSeconds: number }>();
    logs.forEach((log) => {
      const existing = mangaMap.get(log.mangaId);
      if (existing) {
        existing.chaptersRead += 1;
        existing.totalTimeSeconds += log.totalTimeSeconds;
      } else {
        mangaMap.set(log.mangaId, {
          chaptersRead: 1,
          totalTimeSeconds: log.totalTimeSeconds,
        });
      }
    });

    const readingByManga = Array.from(mangaMap.entries()).map(([mangaId, stats]) => ({
      mangaId,
      ...stats,
    }));

    return {
      userId,
      totalChaptersRead,
      totalCompletions,
      totalTimeSeconds,
      recentReads,
      readingByManga,
    };
  }

  /**
   * Obtener estadísticas para el dashboard del creador
   */
  async getCreatorStats(
    mangaIds: string[],
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
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
  }> {
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

    const result = stats[0] || {
      totalViews: 0,
      totalCompletions: 0,
      avgTime: 0,
    };

    const totalReads = result.totalViews;
    const totalCompletions = result.totalCompletions;

    return {
      totalViews: totalReads,
      totalReads,
      totalCompletions,
      completionRate: totalReads > 0 ? Math.round((totalCompletions / totalReads) * 100) : 0,
      avgTimeSeconds: Math.round(result.avgTime || 0),
      chapterStats: chapterStats.map((c) => ({
        chapterId: c.chapterId,
        mangaId: c.mangaId,
        reads: c.reads,
        completions: c.completions,
        completionRate: Math.round(c.completionRate || 0),
      })),
    };
  }

  /**
   * Obtener logs de lectura para un capítulo específico
   */
  async getChapterReadingLogs(
    chapterId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ logs: IReadingLog[]; total: number }> {
    await dbConnect();

    const { limit = 20, offset = 0 } = options;

    const [logs, total] = await Promise.all([
      ReadingLogModel.find({ chapterId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ReadingLogModel.countDocuments({ chapterId }),
    ]);

    return { logs, total };
  }

  /**
   * Verificar si un usuario ha completado un capítulo
   */
  async hasUserCompletedChapter(userId: string, chapterId: string): Promise<boolean> {
    await dbConnect();

    const log = await ReadingLogModel.findOne({
      userId,
      chapterId,
      completed: true,
    });

    return !!log;
  }
}

// Exportar instancia singleton
export const readingAnalyticsService = ReadingAnalyticsService.getInstance();

export default readingAnalyticsService;
