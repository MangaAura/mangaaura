/**
 * Caso de uso: Obtener Manga
 * @packageDocumentation
 */

import { MangaResponseDTO, mapMangaToResponseDTO, PaginatedMangaResponseDTO } from '../../dtos/manga/MangaResponseDTO';
import { IMangaRepository, MangaNotFoundError } from '../../ports/IMangaRepository';

export interface GetMangaInputDTO {
  mangaId: string;
}

export class GetMangaUseCase {
  constructor(
    private readonly mangaRepo: IMangaRepository
  ) {}

  async execute(input: GetMangaInputDTO): Promise<{ manga: MangaResponseDTO }> {
    const manga = await this.mangaRepo.findById(input.mangaId);
    if (!manga) {
      throw new MangaNotFoundError(input.mangaId);
    }

    return {
      manga: mapMangaToResponseDTO(manga),
    };
  }
}

export class ListMangasUseCase {
  constructor(
    private readonly mangaRepo: IMangaRepository
  ) {}

  async execute(filters: {
    authorId?: string;
    page?: number;
    limit?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'totalViews' | 'rating';
  }): Promise<PaginatedMangaResponseDTO> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const mangas = await this.mangaRepo.findAll({
      authorId: filters.authorId,
      orderBy: filters.orderBy ?? 'createdAt',
      orderDirection: 'desc',
      page,
      limit,
    });

    const total = await this.mangaRepo.count({
      authorId: filters.authorId,
    });

    return {
      items: mangas.map(mapMangaToResponseDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}