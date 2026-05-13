/**
 * Caso de uso: Eliminar Manga
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { IMangaRepository, MangaNotFoundError } from '../../ports/IMangaRepository';

export interface DeleteMangaInputDTO {
  userId: string;
  mangaId: string;
}

export class DeleteMangaUseCase {
  constructor(
    private readonly mangaRepo: IMangaRepository,
    private readonly chapterRepo: {
      findByMangaId: (mangaId: string) => Promise<{ id: string }[]>;
      delete: (id: string) => Promise<void>;
    }
  ) {}

  async execute(input: DeleteMangaInputDTO): Promise<{ deleted: boolean }> {
    const manga = await this.mangaRepo.findById(input.mangaId);
    if (!manga) {
      throw new MangaNotFoundError(input.mangaId);
    }

    if (manga.authorId !== input.userId) {
      throw new NotOwnerError();
    }

    const chapters = await this.chapterRepo.findByMangaId(input.mangaId);
    for (const chapter of chapters) {
      await this.chapterRepo.delete(chapter.id);
    }

    await this.mangaRepo.delete(input.mangaId);

    return { deleted: true };
  }
}

class NotOwnerError extends DomainError {
  readonly code = 'NOT_OWNER';
  readonly isOperational = true;
  constructor() {
    super('No tienes permisos para eliminar este manga');
  }
}