/**
 * Caso de uso: Crear Capítulo
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { Chapter } from '../../../core/entities/Chapter';
import { IEventBus } from '../../services/IEventBus';
import { IMangaRepository, MangaNotFoundError } from '../../ports/IMangaRepository';
import { IChapterRepository, ChapterNumberAlreadyExistsError } from '../../ports/IChapterRepository';
import { ChapterPublishedEvent } from '../../events/MangaEvents';
import { ChapterResponseDTO, mapChapterToResponseDTO } from '../../dtos/chapter/ChapterResponseDTO';
import { validateCreateChapterDTO, CreateChapterDTO } from '../../dtos/chapter/CreateChapterDTO';

export interface CreateChapterInputDTO extends CreateChapterDTO {
  userId: string;
}

export class CreateChapterUseCase {
  constructor(
    private readonly mangaRepo: IMangaRepository,
    private readonly chapterRepo: IChapterRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateChapterInputDTO): Promise<{ chapter: ChapterResponseDTO }> {
    validateCreateChapterDTO(input);

    const manga = await this.mangaRepo.findById(input.mangaId);
    if (!manga) {
      throw new MangaNotFoundError(input.mangaId);
    }

    if (manga.authorId !== input.userId) {
      throw new NotOwnerError();
    }

    const exists = await this.chapterRepo.existsByNumber(input.mangaId, input.chapterNumber);
    if (exists) {
      throw new ChapterNumberAlreadyExistsError(input.mangaId, input.chapterNumber);
    }

    const { chapter } = Chapter.create({
      mangaId: input.mangaId,
      chapterNumber: input.chapterNumber,
      title: input.title,
      totalPages: input.totalPages,
      pageUrls: input.pageUrls,
      crowdfundingGoal: input.crowdfundingGoal,
    });

    chapter.clearDomainEvents();
    chapter.publish();

    const created = await this.chapterRepo.create({
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapter.totalPages,
      pageUrls: chapter.pageUrls,
      isCrowdfunded: !!input.crowdfundingGoal,
      crowdfundingGoal: input.crowdfundingGoal,
      publishedAt: chapter.publishedAt ?? new Date(),
    });

    await this.eventBus.publish(
      new ChapterPublishedEvent({
        chapterId: created.id,
        mangaId: input.mangaId,
        chapterNumber: input.chapterNumber,
        title: input.title,
        authorId: input.userId,
        isCrowdfunded: !!input.crowdfundingGoal,
        totalPages: input.totalPages,
      })
    );

    return {
      chapter: mapChapterToResponseDTO(created),
    };
  }
}

class NotOwnerError extends DomainError {
  readonly code = 'NOT_OWNER';
  readonly isOperational = true;
  constructor() {
    super('No tienes permisos para agregar cap\u00edtulos a este manga');
  }
}