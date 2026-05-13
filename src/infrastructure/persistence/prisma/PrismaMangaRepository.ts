/**
 * Adaptador Prisma para el repositorio de Mangas
 * @packageDocumentation
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Manga, type MangaStatus } from '@/core/entities/Manga';
import { Slug } from '@/core/value-objects/Slug';
import type { MangaRepository, MangaFilters } from '@/core/repositories/MangaRepository';
import type { IMangaRepository, MangaSeries, MangaFilters as AppMangaFilters } from '@/application/ports/IMangaRepository';

type PrismaMangaRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  authorId: string;
  authorName: string | null;
  status: string;
  tags: string;
  totalViews: number;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaMangaRepository implements MangaRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  private mapToEntity(data: PrismaMangaRow): Manga {
    let tags: string[] = [];
    try {
      tags = JSON.parse(data.tags || '[]');
    } catch { /* empty */ }

    return new Manga({
      id: data.id,
      title: data.title,
      slug: Slug.create(data.slug),
      description: data.description ?? undefined,
      coverUrl: data.coverUrl ?? undefined,
      authorId: data.authorId,
      authorName: data.authorName ?? undefined,
      status: data.status as MangaStatus,
      tags,
      totalViews: data.totalViews,
      rating: data.rating ?? 0,
      chaptersCount: 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Manga | null> {
    const data = await this.client.mangaSeries.findUnique({ where: { id } });
    return data ? this.mapToEntity(data as unknown as PrismaMangaRow) : null;
  }

  async findBySlug(slug: string): Promise<Manga | null> {
    const data = await this.client.mangaSeries.findUnique({ where: { slug } });
    return data ? this.mapToEntity(data as unknown as PrismaMangaRow) : null;
  }

  async findAll(filters?: MangaFilters): Promise<Manga[]> {
    const { title, status, tags, authorId, orderBy = 'createdAt', orderDirection = 'desc', page = 1, limit = 20 } = filters ?? {};
    const where: Record<string, unknown> = {};

    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (status) where.status = Array.isArray(status) ? { in: status } : status;
    if (tags?.length) where.tags = { contains: tags[0], mode: 'insensitive' };
    if (authorId) where.authorId = authorId;

    const orderByMap: Record<string, string> = {
      title: 'title',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      totalViews: 'totalViews',
      rating: 'rating',
    };

    const results = await this.client.mangaSeries.findMany({
      where,
      orderBy: { [orderByMap[orderBy] || 'createdAt']: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
    });

    return results.map(r => this.mapToEntity(r as unknown as PrismaMangaRow));
  }

  async save(manga: Manga): Promise<void> {
    await this.client.mangaSeries.upsert({
      where: { id: manga.id },
      create: {
        id: manga.id,
        title: manga.title,
        slug: manga.slug.value,
        description: manga.description ?? null,
        coverUrl: manga.coverUrl ?? null,
        authorId: manga.authorId,
        authorName: manga.authorName,
        status: manga.status,
        tags: JSON.stringify(manga.tags),
        totalViews: manga.totalViews,
        rating: manga.rating,
      },
      update: {
        title: manga.title,
        slug: manga.slug.value,
        description: manga.description ?? null,
        coverUrl: manga.coverUrl ?? null,
        status: manga.status,
        tags: JSON.stringify(manga.tags),
        totalViews: manga.totalViews,
        rating: manga.rating,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.mangaSeries.delete({ where: { id } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.client.mangaSeries.count({ where: { slug } });
    return count > 0;
  }

  async getPopular(limit = 10): Promise<Manga[]> {
    const results = await this.client.mangaSeries.findMany({
      orderBy: { totalViews: 'desc' },
      take: limit,
    });
    return results.map(r => this.mapToEntity(r as unknown as PrismaMangaRow));
  }

  async getTopRated(limit = 10): Promise<Manga[]> {
    const results = await this.client.mangaSeries.findMany({
      orderBy: { rating: 'desc' },
      take: limit,
    });
    return results.map(r => this.mapToEntity(r as unknown as PrismaMangaRow));
  }

  async findByAuthor(authorId: string): Promise<Manga[]> {
    const results = await this.client.mangaSeries.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });
    return results.map(r => this.mapToEntity(r as unknown as PrismaMangaRow));
  }

  async count(filters?: Omit<MangaFilters, 'page' | 'limit' | 'orderBy' | 'orderDirection'>): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filters?.authorId) where.authorId = filters.authorId;
    if (filters?.status) where.status = filters.status;
    if (filters?.title) where.title = { contains: filters.title, mode: 'insensitive' };
    return this.client.mangaSeries.count({ where });
  }
}