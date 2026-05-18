/**
 * Caso de uso: Actualizar Manga
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { MangaResponseDTO, mapMangaToResponseDTO } from '../../dtos/manga/MangaResponseDTO';
import { UpdateMangaDTO } from '../../dtos/manga/UpdateMangaDTO';
import { MangaUpdatedEvent } from '../../events/MangaEvents';
import { IMangaRepository, MangaNotFoundError } from '../../ports/IMangaRepository';
import { IEventBus } from '../../services/IEventBus';

export interface UpdateMangaInputDTO extends UpdateMangaDTO {
  userId: string;
  mangaId: string;
}

export class UpdateMangaUseCase {
  constructor(
    private readonly mangaRepo: IMangaRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: UpdateMangaInputDTO): Promise<{ manga: MangaResponseDTO }> {
    if (!input.mangaId) {
      throw new ValidationError('ID de manga requerido');
    }

    const manga = await this.mangaRepo.findById(input.mangaId);
    if (!manga) {
      throw new MangaNotFoundError(input.mangaId);
    }

    if (manga.authorId !== input.userId) {
      throw new NotOwnerError();
    }

    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) {
      let newSlug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      let counter = 1;
      while (await this.mangaRepo.existsBySlug(newSlug)) {
        const existing = await this.mangaRepo.findBySlug(newSlug);
        if (existing && existing.id === input.mangaId) break;
        newSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateData.slug = newSlug;
    }
    if (input.description !== undefined) updateData.description = input.description;
    if (input.coverUrl !== undefined) updateData.coverUrl = input.coverUrl;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.tags !== undefined) updateData.tags = input.tags;

    const updated = await this.mangaRepo.update(input.mangaId, updateData);

    await this.eventBus.publish(
      new MangaUpdatedEvent({
        mangaId: input.mangaId,
        authorId: input.userId,
        changes: {},
      })
    );

    return {
      manga: mapMangaToResponseDTO(updated),
    };
  }
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

class NotOwnerError extends DomainError {
  readonly code = 'NOT_OWNER';
  readonly isOperational = true;
  constructor() {
    super('No tienes permisos para editar este manga');
  }
}