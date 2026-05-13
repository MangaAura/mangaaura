import { Chapter } from '../entities/Chapter';

export interface ChapterFilters {
  mangaId?: string;
  page?: number;
  limit?: number;
  orderByChapterNumber?: 'asc' | 'desc';
  onlyPublished?: boolean;
}

export interface ChapterRepository {
  findById(id: string): Promise<Chapter | null>;
  findByMangaId(mangaId: string): Promise<Chapter[]>;
  findByMangaIdAndNumber(mangaId: string, chapterNumber: number): Promise<Chapter | null>;
  findAll(filters?: ChapterFilters): Promise<Chapter[]>;
  save(chapter: Chapter): Promise<void>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<number>;
  getLastChapter(mangaId: string): Promise<Chapter | null>;
  getNextChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null>;
  getPreviousChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null>;
  existsByNumber(mangaId: string, chapterNumber: number): Promise<boolean>;
  countByMangaId(mangaId: string): Promise<number>;
  count(): Promise<number>;
  addCrowdfundingContribution(id: string, amount: number): Promise<number>;
}