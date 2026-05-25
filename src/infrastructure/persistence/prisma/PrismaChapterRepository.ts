/**
 * Adaptador Prisma para el repositorio de Capítulos
 * @packageDocumentation
 */


import { Chapter } from '@/core/entities/Chapter';
import type { ChapterRepository, ChapterFilters } from '@/core/repositories/ChapterRepository';
import { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type PrismaChapterRow = {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  pageUrls: string;
  viewCount: number;
  isCrowdfunded: boolean;
  crowdfundingGoal: number | null;
  crowdfundingCurrent: number;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaChapterRepository implements ChapterRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  private mapToEntity(data: PrismaChapterRow): Chapter {
    let pageUrls: string[] = [];
    try {
      pageUrls = JSON.parse(data.pageUrls || '[]');
    } catch { /* empty */ }

    return new Chapter({
      id: data.id,
      mangaId: data.mangaId,
      chapterNumber: data.chapterNumber,
      title: data.title ?? undefined,
      totalPages: data.totalPages,
      pageUrls,
      viewCount: data.viewCount,
      isCrowdfunded: data.isCrowdfunded,
      crowdfundingGoal: data.crowdfundingGoal ?? undefined,
      crowdfundingCurrent: data.crowdfundingCurrent,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Chapter | null> {
    const data = await this.client.chapter.findUnique({ where: { id } });
    return data ? this.mapToEntity(data as unknown as PrismaChapterRow) : null;
  }

  async findByMangaId(mangaId: string): Promise<Chapter[]> {
    const results = await this.client.chapter.findMany({
      where: { mangaId },
      orderBy: { chapterNumber: 'asc' },
    });
    return results.map(r => this.mapToEntity(r as unknown as PrismaChapterRow));
  }

  async findByMangaIdAndNumber(mangaId: string, chapterNumber: number): Promise<Chapter | null> {
    const data = await this.client.chapter.findUnique({
      where: { mangaId_chapterNumber: { mangaId, chapterNumber } },
    });
    return data ? this.mapToEntity(data as unknown as PrismaChapterRow) : null;
  }

  async findAll(filters?: ChapterFilters): Promise<Chapter[]> {
    const where: Record<string, unknown> = {};
    if (filters?.mangaId) where.mangaId = filters.mangaId;

    const results = await this.client.chapter.findMany({
      where,
      orderBy: { chapterNumber: filters?.orderByChapterNumber ?? 'asc' },
      skip: filters?.page ? (filters.page - 1) * (filters.limit ?? 50) : 0,
      take: filters?.limit ?? 50,
    });
    return results.map(r => this.mapToEntity(r as unknown as PrismaChapterRow));
  }

  async save(chapter: Chapter): Promise<void> {
    await this.client.chapter.upsert({
      where: { id: chapter.id },
      create: {
        id: chapter.id,
        mangaId: chapter.mangaId,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title ?? null,
        totalPages: chapter.totalPages,
        pageUrls: JSON.stringify(chapter.pageUrls),
        viewCount: chapter.viewCount,
        isCrowdfunded: chapter.isCrowdfunded,
        crowdfundingGoal: chapter.crowdfundingGoal ?? null,
        crowdfundingCurrent: chapter.crowdfundingCurrent,
      },
      update: {
        title: chapter.title ?? null,
        pageUrls: JSON.stringify(chapter.pageUrls),
        totalPages: chapter.totalPages,
        viewCount: chapter.viewCount,
        isCrowdfunded: chapter.isCrowdfunded,
        crowdfundingGoal: chapter.crowdfundingGoal ?? null,
        crowdfundingCurrent: chapter.crowdfundingCurrent,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.chapter.delete({ where: { id } });
  }

  async incrementViewCount(id: string): Promise<number> {
    const result = await this.client.chapter.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return result.viewCount;
  }

  async getLastChapter(mangaId: string): Promise<Chapter | null> {
    const data = await this.client.chapter.findFirst({
      where: { mangaId },
      orderBy: { chapterNumber: 'desc' },
    });
    return data ? this.mapToEntity(data as unknown as PrismaChapterRow) : null;
  }

  async getNextChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null> {
    const data = await this.client.chapter.findFirst({
      where: { mangaId, chapterNumber: { gt: currentChapterNumber } },
      orderBy: { chapterNumber: 'asc' },
    });
    return data ? this.mapToEntity(data as unknown as PrismaChapterRow) : null;
  }

  async getPreviousChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null> {
    const data = await this.client.chapter.findFirst({
      where: { mangaId, chapterNumber: { lt: currentChapterNumber } },
      orderBy: { chapterNumber: 'desc' },
    });
    return data ? this.mapToEntity(data as unknown as PrismaChapterRow) : null;
  }

  async existsByNumber(mangaId: string, chapterNumber: number): Promise<boolean> {
    const count = await this.client.chapter.count({
      where: { mangaId, chapterNumber },
    });
    return count > 0;
  }

  async countByMangaId(mangaId: string): Promise<number> {
    return this.client.chapter.count({ where: { mangaId } });
  }

  async count(): Promise<number> {
    return this.client.chapter.count();
  }

  async addCrowdfundingContribution(id: string, amount: number): Promise<number> {
    const result = await this.client.chapter.update({
      where: { id },
      data: {
        crowdfundingCurrent: { increment: amount },
      },
    });
    return result.crowdfundingCurrent;
  }
}