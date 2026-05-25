/**
 * Caso de uso: Crear Manga
 * @packageDocumentation
 */

import { Manga } from '../../../core/entities/Manga';
import { DomainError } from '../../../core/errors/DomainError';
import { syncGenresFromTags } from '../../../lib/genres';
import { validateCreateMangaDTO, CreateMangaDTO, generateSlug } from '../../dtos/manga/CreateMangaDTO';
import { MangaResponseDTO, mapMangaToResponseDTO } from '../../dtos/manga/MangaResponseDTO';
import { MangaCreatedEvent } from '../../events/MangaEvents';
import { IMangaRepository } from '../../ports/IMangaRepository';
import { IUserRepository } from '../../ports/IUserRepository';
import { IEventBus } from '../../services/IEventBus';

// Import syncGenresFromTags directly — this use case runs in the backend

export interface CreateMangaInputDTO extends CreateMangaDTO {
  authorId: string;
}

export class CreateMangaUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly mangaRepo: IMangaRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateMangaInputDTO): Promise<{ manga: MangaResponseDTO }> {
    validateCreateMangaDTO(input);

    const user = await this.userRepo.findById(input.authorId);
    if (!user) {
      throw new UserNotFoundError(input.authorId);
    }

    const baseSlug = generateSlug(input.title);
    let slug = baseSlug;
    let counter = 1;
    while (await this.mangaRepo.existsBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { manga } = Manga.create({
      title: input.title,
      authorId: input.authorId,
      authorName: user.displayName || user.username,
      description: input.description,
      coverUrl: input.coverUrl,
      tags: input.tags,
      status: input.status ?? 'ONGOING',
    });

    // Sync genres from tags — auto-create any new genres in the DB
    if (input.tags && input.tags.length > 0) {
      await syncGenresFromTags(input.tags.map(t => t.toLowerCase().trim()));
    }

    manga.clearDomainEvents();
    await this.mangaRepo.create({
      title: manga.title,
      slug: slug,
      description: manga.description,
      coverUrl: manga.coverUrl,
      authorId: manga.authorId,
      status: manga.status,
      tags: manga.tags,
    });

    const mangaEntity = await this.mangaRepo.findBySlug(slug);
    if (!mangaEntity) {
      throw new MangaCreationFailedError();
    }

    await this.eventBus.publish(
      new MangaCreatedEvent({
        mangaId: mangaEntity.id,
        title: mangaEntity.title,
        slug: slug,
        authorId: input.authorId,
        status: input.status ?? 'ONGOING',
        tags: input.tags ?? [],
      })
    );

    return {
      manga: {
        ...mapMangaToResponseDTO(mangaEntity as unknown as Parameters<typeof mapMangaToResponseDTO>[0]),
        slug,
      },
    };
  }
}

class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(id: string) {
    super(`Usuario no encontrado: ${id}`);
  }
}

class MangaCreationFailedError extends DomainError {
  readonly code = 'MANGA_CREATION_FAILED';
  readonly isOperational = true;
  constructor() {
    super('Error al crear el manga');
  }
}