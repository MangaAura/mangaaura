import { Manga } from '../entities/Manga';

export interface MangaFilters {
  title?: string;
  status?: string | string[];
  tags?: string[];
  authorId?: string;
  orderBy?: 'title' | 'createdAt' | 'updatedAt' | 'totalViews' | 'rating';
  orderDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MangaRepository {
  findById(id: string): Promise<Manga | null>;
  findBySlug(slug: string): Promise<Manga | null>;
  findAll(filters?: MangaFilters): Promise<Manga[]>;
  save(manga: Manga): Promise<void>;
  delete(id: string): Promise<void>;
  existsBySlug(slug: string): Promise<boolean>;
  getPopular(limit?: number): Promise<Manga[]>;
  getTopRated(limit?: number): Promise<Manga[]>;
  findByAuthor(authorId: string): Promise<Manga[]>;
  count(filters?: Omit<MangaFilters, 'page' | 'limit' | 'orderBy' | 'orderDirection'>): Promise<number>;
}